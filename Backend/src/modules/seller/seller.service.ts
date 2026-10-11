import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import {
  SellerApplicationStatus,
  UserRole,
  UserStatus,
} from "@/generated/prisma/enums";
import ApiError from "@/errors/ApiError";
import { prisma } from "@/lib/prisma";
import { deleteFromR2, getPresignedDownloadUrl, uploadBufferToR2 } from "@/utils/r2";
import type { Express } from "express";
import type {
  CreateSellerApplicationInput,
  ListSellerApplicationsQuery,
  ReviewSellerApplicationInput,
} from "./seller.validation";

const sellerApplicationSelect = {
  id: true,
  userId: true,
  pharmacyName: true,
  licenseNumber: true,
  businessAddress: true,
  contactPhone: true,
  licenseDocumentKey: true,
  status: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
    },
  },
  reviewedBy: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.SellerApplicationSelect;

type SellerApplicationRecord = Prisma.SellerApplicationGetPayload<{
  select: typeof sellerApplicationSelect;
}>;

const toPublicApplication = async <
  T extends { licenseDocumentKey: string },
>(
  application: T,
) => {
  const { licenseDocumentKey, ...safeApplication } = application;
  const licenseDocumentUrl = await getPresignedDownloadUrl(
    licenseDocumentKey,
    300,
  );

  return { ...safeApplication, licenseDocumentUrl };
};

const documentExtensionByMimeType: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const createOrResubmitApplication = async (
  userId: string,
  data: CreateSellerApplicationInput,
  file: Express.Multer.File,
) => {
  const extension = documentExtensionByMimeType[file.mimetype];
  if (!extension) {
    throw new ApiError(400, "Unsupported license document type");
  }

  const documentKey = `seller-licenses/${userId}/${randomUUID()}.${extension}`;
  await uploadBufferToR2(documentKey, file.buffer, file.mimetype);

  let oldDocumentKey: string | null = null;
  let application: SellerApplicationRecord;

  try {
    application = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, status: true },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new ApiError(403, "Only active users can apply to become sellers");
      }

      if (user.role !== UserRole.CUSTOMER) {
        throw new ApiError(403, "Only customer accounts can apply to become sellers");
      }

      const existingApplication =
        await transaction.sellerApplication.findUnique({
          where: { userId },
          select: { id: true, status: true, licenseDocumentKey: true },
        });

      if (
        existingApplication?.status === SellerApplicationStatus.PENDING
      ) {
        throw new ApiError(409, "Your seller application is already pending");
      }

      if (
        existingApplication?.status === SellerApplicationStatus.APPROVED
      ) {
        throw new ApiError(409, "Your seller application has already been approved");
      }

      if (existingApplication) {
        oldDocumentKey = existingApplication.licenseDocumentKey;
        return transaction.sellerApplication.update({
          where: { id: existingApplication.id },
          data: {
            ...data,
            licenseDocumentKey: documentKey,
            status: SellerApplicationStatus.PENDING,
            reviewNote: null,
            reviewedAt: null,
            reviewedById: null,
          },
          select: sellerApplicationSelect,
        });
      }

      return transaction.sellerApplication.create({
        data: { ...data, userId, licenseDocumentKey: documentKey },
        select: sellerApplicationSelect,
      });
    });

  } catch (error) {
    try {
      await deleteFromR2(documentKey);
    } catch (cleanupError) {
      console.error("Failed to clean up seller license upload:", cleanupError);
    }

    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ApiError(
        409,
        "A seller application has already been submitted for this account",
      );
    }

    throw error;
  }

  if (oldDocumentKey) {
    try {
      await deleteFromR2(oldDocumentKey);
    } catch (error) {
      console.error("Failed to delete replaced seller license document:", error);
    }
  }

  return toPublicApplication(application);
};

const getMyApplication = async (userId: string) => {
  const application = await prisma.sellerApplication.findUnique({
    where: { userId },
    select: sellerApplicationSelect,
  });

  if (!application) {
    throw new ApiError(404, "No seller application found");
  }

  return toPublicApplication(application);
};

const listApplications = async (query: ListSellerApplicationsQuery) => {
  const { page, limit, status } = query;
  const where: Prisma.SellerApplicationWhereInput = status ? { status } : {};

  const [applications, totalCount] = await prisma.$transaction([
    prisma.sellerApplication.findMany({
      where,
      select: sellerApplicationSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sellerApplication.count({ where }),
  ]);

  const data = await Promise.all(applications.map(toPublicApplication));

  return {
    applications: data,
    meta: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  };
};

const getApplicationById = async (applicationId: string) => {
  const application = await prisma.sellerApplication.findUnique({
    where: { id: applicationId },
    select: sellerApplicationSelect,
  });

  if (!application) {
    throw new ApiError(404, "Seller application not found");
  }

  return toPublicApplication(application);
};

const reviewApplication = async (
  adminId: string,
  applicationId: string,
  data: ReviewSellerApplicationInput,
) => {
  const application = await prisma.$transaction(async (transaction) => {
    const existingApplication =
      await transaction.sellerApplication.findUnique({
        where: { id: applicationId },
        select: {
          id: true,
          userId: true,
          status: true,
          user: { select: { role: true, status: true } },
        },
      });

    if (!existingApplication) {
      throw new ApiError(404, "Seller application not found");
    }

    if (existingApplication.status !== SellerApplicationStatus.PENDING) {
      throw new ApiError(409, "This seller application has already been reviewed");
    }

    if (data.status === SellerApplicationStatus.APPROVED) {
      if (
        existingApplication.user.role !== UserRole.CUSTOMER ||
        existingApplication.user.status !== UserStatus.ACTIVE
      ) {
        throw new ApiError(
          409,
          "Only active customer accounts can be approved as sellers",
        );
      }

      const promoted = await transaction.user.updateMany({
        where: {
          id: existingApplication.userId,
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
        },
        data: { role: UserRole.SELLER },
      });

      if (promoted.count !== 1) {
        throw new ApiError(
          409,
          "The applicant account changed and can no longer be approved",
        );
      }
    }

    const reviewed = await transaction.sellerApplication.updateMany({
      where: {
        id: applicationId,
        status: SellerApplicationStatus.PENDING,
      },
      data: {
        status: data.status,
        reviewNote: data.reviewNote ?? null,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    });

    if (reviewed.count !== 1) {
      throw new ApiError(409, "This seller application has already been reviewed");
    }

    return transaction.sellerApplication.findUniqueOrThrow({
      where: { id: applicationId },
      select: sellerApplicationSelect,
    });
  });

  return toPublicApplication(application);
};

export const sellerService = {
  createOrResubmitApplication,
  getMyApplication,
  listApplications,
  getApplicationById,
  reviewApplication,
};
