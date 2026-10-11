import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import ApiError from "@/errors/ApiError";
import { generateSlug } from "@/utils/storageKey";
import type {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from "./category.validation";

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

const createCategory = async (data: CreateCategoryInput) => {
  const slug = data.slug ?? generateSlug(data.name);

  if (slug.length < 2) {
    throw new ApiError(400, "Provide a slug containing at least two letters or numbers");
  }

  const duplicate = await prisma.category.findFirst({
    where: {
      OR: [{ name: { equals: data.name, mode: "insensitive" } }, { slug }],
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new ApiError(409, "A category with this name or slug already exists");
  }

  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
    },
    select: categorySelect,
  });
};

const listCategories = async (query: ListCategoriesQuery) => {
  const { page, limit, search, sortBy, sortOrder } = query;
  const where: Prisma.CategoryWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [categories, totalCount] = await prisma.$transaction([
    prisma.category.findMany({
      where,
      select: {
        ...categorySelect,
        _count: { select: { medicines: true } },
      },
      orderBy: [{ [sortBy]: sortOrder }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.category.count({ where }),
  ]);

  return {
    categories,
    meta: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  };
};

const getCategoryByIdOrSlug = async (idOrSlug: string) => {
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    select: {
      ...categorySelect,
      _count: { select: { medicines: true } },
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

const updateCategory = async (
  categoryId: string,
  data: UpdateCategoryInput,
) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, slug: true },
  });

  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  const name = data.name ?? existingCategory.name;
  const slug =
    data.slug ??
    (data.name ? generateSlug(data.name) : existingCategory.slug);

  if (slug.length < 2) {
    throw new ApiError(400, "Provide a slug containing at least two letters or numbers");
  }

  const duplicate = await prisma.category.findFirst({
    where: {
      id: { not: categoryId },
      OR: [{ name: { equals: name, mode: "insensitive" } }, { slug }],
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new ApiError(409, "A category with this name or slug already exists");
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.slug !== undefined || data.name !== undefined ? { slug } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
    },
    select: categorySelect,
  });
};

const deleteCategory = async (categoryId: string) => {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const category = await transaction.category.findUnique({
          where: { id: categoryId },
          select: { id: true },
        });

        if (!category) {
          throw new ApiError(404, "Category not found");
        }

        const medicineCount = await transaction.medicine.count({
          where: { categoryId },
        });

        if (medicineCount > 0) {
          throw new ApiError(
            409,
            "This category cannot be deleted while it contains medicines",
          );
        }

        return transaction.category.delete({
          where: { id: categoryId },
          select: categorySelect,
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "P2034"
    ) {
      throw new ApiError(
        409,
        "The category changed while being deleted. Please retry.",
      );
    }

    throw error;
  }
};

export const categoryService = {
  createCategory,
  listCategories,
  getCategoryByIdOrSlug,
  updateCategory,
  deleteCategory,
};
