import type { Prisma } from "@/generated/prisma/client";
import { OrderStatus } from "@/generated/prisma/enums";
import ApiError from "@/errors/ApiError";
import { prisma } from "@/lib/prisma";
import type {
  AdminListReviewsQuery,
  CreateReviewInput,
  ListReviewsQuery,
  UpdateReviewInput,
} from "./review.validation";

const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: { id: true, name: true, image: true },
  },
  medicine: {
    select: { id: true, name: true },
  },
} satisfies Prisma.ReviewSelect;

const getRatingSummary = async (medicineId: string) => {
  const summary = await prisma.review.aggregate({
    where: { medicineId },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return {
    averageRating: summary._avg.rating
      ? Math.round(summary._avg.rating * 100) / 100
      : 0,
    reviewCount: summary._count._all,
  };
};

const ensureMedicineExists = async (medicineId: string) => {
  const medicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
    select: { id: true },
  });

  if (!medicine) {
    throw new ApiError(404, "Medicine not found");
  }
};

const listMedicineReviews = async (
  medicineId: string,
  query: ListReviewsQuery,
) => {
  await ensureMedicineExists(medicineId);
  const { page, limit, rating, sortOrder } = query;
  const where: Prisma.ReviewWhereInput = {
    medicineId,
    ...(rating !== undefined ? { rating } : {}),
  };

  const [reviews, totalCount, ratingSummary] = await Promise.all([
    prisma.review.findMany({
      where,
      select: reviewSelect,
      orderBy: [{ createdAt: sortOrder }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
    getRatingSummary(medicineId),
  ]);

  return {
    reviews,
    ratingSummary,
    meta: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  };
};

const createReview = async (
  customerId: string,
  medicineId: string,
  data: CreateReviewInput,
) => {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const deliveredPurchase = await transaction.orderItem.findFirst({
          where: {
            medicineId,
            order: { customerId, status: OrderStatus.DELIVERED },
          },
          select: { id: true },
        });

        if (!deliveredPurchase) {
          throw new ApiError(
            403,
            "You can review a medicine only after its order has been delivered",
          );
        }

        return transaction.review.create({
          data: { ...data, medicineId, customerId },
          select: reviewSelect,
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ApiError(409, "You have already reviewed this medicine");
    }

    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "P2034"
    ) {
      throw new ApiError(
        409,
        "The review could not be saved because the order changed. Please retry.",
      );
    }

    throw error;
  }
};

const listCustomerReviews = async (
  customerId: string,
  query: ListReviewsQuery,
) => {
  const { page, limit, rating, sortOrder } = query;
  const where: Prisma.ReviewWhereInput = {
    customerId,
    ...(rating !== undefined ? { rating } : {}),
  };

  const [reviews, totalCount] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      select: reviewSelect,
      orderBy: [{ createdAt: sortOrder }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews,
    meta: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  };
};

const updateReview = async (
  customerId: string,
  reviewId: string,
  data: UpdateReviewInput,
) => {
  const result = await prisma.review.updateMany({
    where: { id: reviewId, customerId },
    data: {
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
      ...(data.comment !== undefined ? { comment: data.comment } : {}),
    },
  });

  if (result.count === 0) {
    throw new ApiError(404, "Review not found");
  }

  return prisma.review.findUniqueOrThrow({
    where: { id: reviewId },
    select: reviewSelect,
  });
};

const deleteCustomerReview = async (customerId: string, reviewId: string) => {
  const result = await prisma.review.deleteMany({
    where: { id: reviewId, customerId },
  });

  if (result.count === 0) {
    throw new ApiError(404, "Review not found");
  }
};

const listAdminReviews = async (query: AdminListReviewsQuery) => {
  const { page, limit, rating, sortOrder, medicineId, customerId } = query;
  const where: Prisma.ReviewWhereInput = {
    ...(medicineId ? { medicineId } : {}),
    ...(customerId ? { customerId } : {}),
    ...(rating !== undefined ? { rating } : {}),
  };

  const [reviews, totalCount] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      select: reviewSelect,
      orderBy: [{ createdAt: sortOrder }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews,
    meta: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  };
};

const deleteAdminReview = async (reviewId: string) => {
  const result = await prisma.review.deleteMany({
    where: { id: reviewId },
  });

  if (result.count === 0) {
    throw new ApiError(404, "Review not found");
  }
};

export const reviewService = {
  listMedicineReviews,
  createReview,
  listCustomerReviews,
  updateReview,
  deleteCustomerReview,
  listAdminReviews,
  deleteAdminReview,
};
