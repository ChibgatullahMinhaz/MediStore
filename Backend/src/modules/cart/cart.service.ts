import type { Prisma } from "@/generated/prisma/client";
import { UserStatus } from "@/generated/prisma/enums";
import ApiError from "@/errors/ApiError";
import { prisma } from "@/lib/prisma";
import { getPresignedDownloadUrl } from "@/utils/r2";
import type { AddCartItemInput, UpdateCartItemInput } from "./cart.validation";

const cartSelect = {
  id: true,
  items: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      quantity: true,
      createdAt: true,
      updatedAt: true,
      medicine: {
        select: {
          id: true,
          name: true,
          manufacturer: true,
          price: true,
          stock: true,
          imageUrl: true,
          isOTC: true,
          category: { select: { id: true, name: true, slug: true } },
          seller: { select: { id: true, name: true, status: true } },
        },
      },
    },
  },
} satisfies Prisma.CartSelect;

type CartRecord = Prisma.CartGetPayload<{ select: typeof cartSelect }>;

const serializeCart = async (cart: CartRecord | null) => {
  const items = await Promise.all(
    (cart?.items ?? []).map(async ({ medicine, ...item }) => {
      const available =
        medicine.isOTC &&
        medicine.stock > 0 &&
        medicine.seller.status === UserStatus.ACTIVE;
      const imageUrl = medicine.imageUrl
        ? await getPresignedDownloadUrl(medicine.imageUrl, 3600)
        : null;

      return {
        ...item,
        available,
        medicine: {
          id: medicine.id,
          name: medicine.name,
          manufacturer: medicine.manufacturer,
          price: medicine.price,
          stock: medicine.stock,
          imageUrl,
          isOTC: medicine.isOTC,
          category: medicine.category,
          seller: { id: medicine.seller.id, name: medicine.seller.name },
        },
        lineTotal: Math.round(medicine.price * item.quantity * 100) / 100,
      };
    }),
  );

  const subtotalInCents = items.reduce(
    (total, item) =>
      total + Math.round(item.medicine.price * 100) * item.quantity,
    0,
  );

  return {
    id: cart?.id ?? null,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: subtotalInCents / 100,
  };
};

const getCartRecord = (userId: string) =>
  prisma.cart.findUnique({
    where: { userId },
    select: cartSelect,
  });

const getCart = async (userId: string) =>
  serializeCart(await getCartRecord(userId));

const translateTransactionConflict = (error: unknown): never => {
  if (
    error instanceof Error &&
    "code" in error &&
    (error.code === "P2034" || error.code === "P2002")
  ) {
    throw new ApiError(
      409,
      "Your cart or medicine stock changed during this request. Please retry.",
    );
  }

  throw error;
};

const addItem = async (userId: string, data: AddCartItemInput) => {
  try {
    await prisma.$transaction(
      async (transaction) => {
        const medicine = await transaction.medicine.findUnique({
          where: { id: data.medicineId },
          select: {
            id: true,
            stock: true,
            isOTC: true,
            seller: { select: { status: true } },
          },
        });

        if (!medicine || !medicine.isOTC) {
          throw new ApiError(404, "OTC medicine not found");
        }

        if (medicine.seller.status !== UserStatus.ACTIVE) {
          throw new ApiError(409, "This medicine is currently unavailable");
        }

        if (medicine.stock < 1) {
          throw new ApiError(409, "This medicine is out of stock");
        }

        const cart = await transaction.cart.upsert({
          where: { userId },
          create: { userId },
          update: {},
          select: { id: true },
        });

        const currentItem = await transaction.cartItem.findUnique({
          where: {
            cartId_medicineId: {
              cartId: cart.id,
              medicineId: medicine.id,
            },
          },
          select: { quantity: true },
        });

        const newQuantity = (currentItem?.quantity ?? 0) + data.quantity;
        if (newQuantity > medicine.stock) {
          throw new ApiError(
            409,
            `Only ${medicine.stock} unit(s) are currently available`,
          );
        }

        await transaction.cartItem.upsert({
          where: {
            cartId_medicineId: {
              cartId: cart.id,
              medicineId: medicine.id,
            },
          },
          create: {
            cartId: cart.id,
            medicineId: medicine.id,
            quantity: data.quantity,
          },
          update: { quantity: { increment: data.quantity } },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    translateTransactionConflict(error);
  }

  return getCart(userId);
};

const updateItemQuantity = async (
  userId: string,
  medicineId: string,
  data: UpdateCartItemInput,
) => {
  try {
    await prisma.$transaction(
      async (transaction) => {
        const item = await transaction.cartItem.findFirst({
          where: { medicineId, cart: { userId } },
          select: {
            id: true,
            medicine: {
              select: {
                stock: true,
                isOTC: true,
                seller: { select: { status: true } },
              },
            },
          },
        });

        if (!item) {
          throw new ApiError(404, "Cart item not found");
        }

        if (!item.medicine.isOTC || item.medicine.seller.status !== UserStatus.ACTIVE) {
          throw new ApiError(409, "This medicine is currently unavailable");
        }

        if (data.quantity > item.medicine.stock) {
          throw new ApiError(
            409,
            `Only ${item.medicine.stock} unit(s) are currently available`,
          );
        }

        await transaction.cartItem.update({
          where: { id: item.id },
          data: { quantity: data.quantity },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    translateTransactionConflict(error);
  }

  return getCart(userId);
};

const removeItem = async (userId: string, medicineId: string) => {
  const result = await prisma.cartItem.deleteMany({
    where: { medicineId, cart: { userId } },
  });

  if (result.count === 0) {
    throw new ApiError(404, "Cart item not found");
  }

  return getCart(userId);
};

const clearCart = async (userId: string) => {
  await prisma.cartItem.deleteMany({
    where: { cart: { userId } },
  });

  return getCart(userId);
};

export const cartService = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
