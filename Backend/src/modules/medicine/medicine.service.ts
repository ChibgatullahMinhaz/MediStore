import { randomUUID } from "node:crypto";
import type { Express } from "express";
import type { Prisma } from "@/generated/prisma/client";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
import ApiError from "@/errors/ApiError";
import { prisma } from "@/lib/prisma";
import { toWebp } from "@/utils/imageUtils";
import { deleteFromR2, getPresignedDownloadUrl, uploadBufferToR2 } from "@/utils/r2";
import type {
  CreateMedicineInput,
  ListMedicinesQuery,
  UpdateMedicineInput,
} from "./medicine.validation";

const medicineSelect = {
  id: true,
  name: true,
  manufacturer: true,
  price: true,
  stock: true,
  description: true,
  imageUrl: true,
  isOTC: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: { id: true, name: true, slug: true },
  },
  seller: {
    select: { id: true, name: true },
  },
  _count: {
    select: { reviews: true },
  },
} satisfies Prisma.MedicineSelect;

type MedicineRecord = Prisma.MedicineGetPayload<{
  select: typeof medicineSelect;
}>;

const toPublicMedicine = async (medicine: MedicineRecord) => ({
  ...medicine,
  imageUrl: medicine.imageUrl
    ? await getPresignedDownloadUrl(medicine.imageUrl, 3600)
    : null,
});

const uploadMedicineImage = async (
  sellerId: string,
  file: Express.Multer.File,
) => {
  let image: Awaited<ReturnType<typeof toWebp>>;

  try {
    image = await toWebp(file.buffer, { width: 1600, quality: 82 });
  } catch {
    throw new ApiError(400, "The uploaded medicine image could not be processed");
  }

  const key = `medicines/${sellerId}/${randomUUID()}.webp`;
  await uploadBufferToR2(key, image.buffer, image.contentType);
  return key;
};

const removeUploadedImage = async (key: string) => {
  try {
    await deleteFromR2(key);
  } catch (error) {
    console.error("Failed to clean up medicine image:", error);
  }
};

const createMedicine = async (
  sellerId: string,
  data: CreateMedicineInput,
  file?: Express.Multer.File,
) => {
  const [seller, category] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sellerId },
      select: { role: true, status: true },
    }),
    prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    }),
  ]);

  if (
    !seller ||
    seller.role !== UserRole.SELLER ||
    seller.status !== UserStatus.ACTIVE
  ) {
    throw new ApiError(403, "An active seller account is required");
  }

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const imageKey = file ? await uploadMedicineImage(sellerId, file) : null;

  let medicine: MedicineRecord;
  try {
    medicine = await prisma.medicine.create({
      data: {
        name: data.name,
        manufacturer: data.manufacturer,
        price: data.price,
        stock: data.stock,
        description: data.description,
        categoryId: data.categoryId,
        sellerId,
        ...(data.isOTC !== undefined ? { isOTC: data.isOTC } : {}),
        ...(imageKey ? { imageUrl: imageKey } : {}),
      },
      select: medicineSelect,
    });
  } catch (error) {
    if (imageKey) {
      await removeUploadedImage(imageKey);
    }

    throw error;
  }

  return toPublicMedicine(medicine);
};

const buildMedicineWhere = (
  query: ListMedicinesQuery,
  options: { publicOnly?: boolean; sellerId?: string } = {},
): Prisma.MedicineWhereInput => {
  const { search, category, manufacturer, minPrice, maxPrice, inStock } = query;
  return {
    ...(options.publicOnly ? { isOTC: true } : {}),
    ...(options.sellerId ? { sellerId: options.sellerId } : {}),
    ...(query.isOTC !== undefined && !options.publicOnly
      ? { isOTC: query.isOTC }
      : {}),
    ...(query.sellerId && !options.publicOnly
      ? { sellerId: query.sellerId }
      : {}),
    ...(category
      ? { category: { OR: [{ id: category }, { slug: category }] } }
      : {}),
    ...(manufacturer
      ? { manufacturer: { contains: manufacturer, mode: "insensitive" } }
      : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
    ...(inStock === true ? { stock: { gt: 0 } } : {}),
    ...(inStock === false ? { stock: { equals: 0 } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { manufacturer: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
};

const listMedicines = async (
  query: ListMedicinesQuery,
  options: { publicOnly?: boolean; sellerId?: string } = {},
) => {
  const { page, limit, sortBy, sortOrder } = query;
  const where = buildMedicineWhere(query, options);

  const [medicines, totalCount] = await prisma.$transaction([
    prisma.medicine.findMany({
      where,
      select: medicineSelect,
      orderBy: [{ [sortBy]: sortOrder }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.medicine.count({ where }),
  ]);

  return {
    medicines: await Promise.all(medicines.map(toPublicMedicine)),
    meta: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  };
};

const findMedicine = async (
  medicineId: string,
  options: { publicOnly?: boolean; sellerId?: string } = {},
) => {
  const medicine = await prisma.medicine.findFirst({
    where: {
      id: medicineId,
      ...(options.publicOnly ? { isOTC: true } : {}),
      ...(options.sellerId ? { sellerId: options.sellerId } : {}),
    },
    select: medicineSelect,
  });

  if (!medicine) {
    throw new ApiError(404, "Medicine not found");
  }

  return toPublicMedicine(medicine);
};

const updateMedicine = async (
  medicineId: string,
  data: UpdateMedicineInput,
  options: { sellerId?: string; file?: Express.Multer.File } = {},
) => {
  const existing = await prisma.medicine.findFirst({
    where: {
      id: medicineId,
      ...(options.sellerId ? { sellerId: options.sellerId } : {}),
    },
    select: { id: true, imageUrl: true },
  });

  if (!existing) {
    throw new ApiError(404, "Medicine not found");
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }
  }

  const uploadedImageKey = options.file
    ? await uploadMedicineImage(options.sellerId ?? "admin", options.file)
    : null;
  const removeImage = data.removeImage === true;
  const oldImageKey =
    uploadedImageKey || removeImage ? existing.imageUrl : null;

  let medicine: MedicineRecord;
  try {
    medicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.manufacturer !== undefined
          ? { manufacturer: data.manufacturer }
          : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.stock !== undefined ? { stock: data.stock } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.categoryId !== undefined
          ? { categoryId: data.categoryId }
          : {}),
        ...(data.isOTC !== undefined ? { isOTC: data.isOTC } : {}),
        ...(uploadedImageKey ? { imageUrl: uploadedImageKey } : {}),
        ...(removeImage ? { imageUrl: null } : {}),
      },
      select: medicineSelect,
    });
  } catch (error) {
    if (uploadedImageKey) {
      await removeUploadedImage(uploadedImageKey);
    }

    throw error;
  }

  if (oldImageKey) {
    await removeUploadedImage(oldImageKey);
  }

  return toPublicMedicine(medicine);
};

const deleteMedicine = async (
  medicineId: string,
  options: { sellerId?: string } = {},
) => {
  try {
    const { deleted, imageKey } = await prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.medicine.findFirst({
          where: {
            id: medicineId,
            ...(options.sellerId ? { sellerId: options.sellerId } : {}),
          },
          select: {
            id: true,
            imageUrl: true,
            _count: { select: { orderItems: true, reviews: true } },
          },
        });

        if (!existing) {
          throw new ApiError(404, "Medicine not found");
        }

        if (
          existing._count.orderItems > 0 ||
          existing._count.reviews > 0
        ) {
          throw new ApiError(
            409,
            "This medicine cannot be deleted because it has orders or reviews",
          );
        }

        const deletedMedicine = await transaction.medicine.delete({
          where: { id: medicineId },
          select: { id: true },
        });

        return { deleted: deletedMedicine, imageKey: existing.imageUrl };
      },
      { isolationLevel: "Serializable" },
    );

    if (imageKey) {
      await removeUploadedImage(imageKey);
    }

    return deleted;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "P2034"
    ) {
      throw new ApiError(
        409,
        "The medicine changed while being deleted. Please retry.",
      );
    }

    throw error;
  }
};

export const medicineService = {
  createMedicine,
  listMedicines,
  findMedicine,
  updateMedicine,
  deleteMedicine,
};
