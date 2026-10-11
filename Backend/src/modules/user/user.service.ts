import type { Prisma } from "@/generated/prisma/client";
import { UserStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import ApiError from "@/errors/ApiError";
import type { UpdateProfileInput, UpdateUserStatusInput, ListUsersQuery } from "./user.validation";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  role: true,
  status: true,
  phone: true,
  address: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const updateProfile = (userId: string, data: UpdateProfileInput) =>
  prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
    },
    select: publicUserSelect,
  });

const listUsers = async (query: ListUsersQuery) => {
  const { page, limit, search, role, status, sortBy, sortOrder } = query;
  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    meta: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  };
};

const updateUserStatus = async (
  adminId: string,
  targetUserId: string,
  data: UpdateUserStatusInput,
) => {
  if (adminId === targetUserId) {
    throw new ApiError(403, "You cannot change your own account status");
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { status: data.status },
    select: publicUserSelect,
  });
};

export const userService = {
  getProfile,
  updateProfile,
  listUsers,
  updateUserStatus,
};
