import type { Prisma } from "@/generated/prisma/client";
import {
  OrderStatus,
  PaymentStatus,
  UserRole,
  UserStatus,
} from "@/generated/prisma/enums";
import ApiError from "@/errors/ApiError";
import { prisma } from "@/lib/prisma";
import type {
  CreateOrderInput,
  ListOrdersQuery,
  UpdateOrderStatusInput,
} from "./order.validation";

const orderSelect = {
  id: true,
  totalAmount: true,
  status: true,
  paymentStatus: true,
  shippingAddress: true,
  contactPhone: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: { id: true, name: true, email: true },
  },
  orderItems: {
    select: {
      id: true,
      quantity: true,
      price: true,
      medicine: {
        select: {
          id: true,
          name: true,
          manufacturer: true,
          seller: { select: { id: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

const sellerOrderWhere = (sellerId: string): Prisma.OrderWhereInput => ({
  orderItems: {
    some: { medicine: { sellerId } },
    every: { medicine: { sellerId } },
  },
});

const translateTransactionConflict = (error: unknown): never => {
  if (
    error instanceof Error &&
    "code" in error &&
    (error.code === "P2034" || error.code === "P2002")
  ) {
    throw new ApiError(
      409,
      "Inventory or order status changed during this request. Please retry.",
    );
  }

  throw error;
};

const createFromCart = async (customerId: string, data: CreateOrderInput) => {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const cart = await transaction.cart.findUnique({
          where: { userId: customerId },
          select: {
            id: true,
            items: {
              select: {
                id: true,
                quantity: true,
                medicine: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    stock: true,
                    isOTC: true,
                    sellerId: true,
                    seller: {
                      select: { role: true, status: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!cart?.items.length) {
          throw new ApiError(400, "Your cart is empty");
        }

        const itemsBySeller = new Map<
          string,
          Array<{
            medicineId: string;
            quantity: number;
            priceInCents: number;
          }>
        >();

        for (const item of cart.items) {
          const { medicine } = item;
          if (
            !medicine.isOTC ||
            medicine.seller.role !== UserRole.SELLER ||
            medicine.seller.status !== UserStatus.ACTIVE
          ) {
            throw new ApiError(
              409,
              `${medicine.name} is no longer available for purchase`,
            );
          }

          if (item.quantity > medicine.stock) {
            throw new ApiError(
              409,
              `Only ${medicine.stock} unit(s) of ${medicine.name} are currently available`,
            );
          }

          const sellerItems = itemsBySeller.get(medicine.sellerId) ?? [];
          sellerItems.push({
            medicineId: medicine.id,
            quantity: item.quantity,
            priceInCents: Math.round(medicine.price * 100),
          });
          itemsBySeller.set(medicine.sellerId, sellerItems);
        }

        const createdOrders: Prisma.OrderGetPayload<{
          select: typeof orderSelect;
        }>[] = [];
        for (const sellerItems of itemsBySeller.values()) {
          let totalInCents = 0;
          for (const item of sellerItems) {
            const stockUpdate = await transaction.medicine.updateMany({
              where: {
                id: item.medicineId,
                isOTC: true,
                stock: { gte: item.quantity },
              },
              data: { stock: { decrement: item.quantity } },
            });

            if (stockUpdate.count !== 1) {
              throw new ApiError(
                409,
                "Medicine stock changed during checkout. Please review your cart and retry.",
              );
            }

            totalInCents += item.priceInCents * item.quantity;
          }

          const order = await transaction.order.create({
            data: {
              customerId,
              totalAmount: totalInCents / 100,
              shippingAddress: data.shippingAddress,
              contactPhone: data.contactPhone,
              orderItems: {
                create: sellerItems.map((item) => ({
                  medicineId: item.medicineId,
                  quantity: item.quantity,
                  price: item.priceInCents / 100,
                })),
              },
            },
            select: orderSelect,
          });

          createdOrders.push(order);
        }

        await transaction.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return createdOrders;
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    translateTransactionConflict(error);
  }
};

const listOrders = async (
  query: ListOrdersQuery,
  scope: { customerId?: string; sellerId?: string } = {},
) => {
  const { page, limit, status, sortOrder } = query;
  const where: Prisma.OrderWhereInput = {
    ...(scope.customerId ? { customerId: scope.customerId } : {}),
    ...(scope.sellerId ? sellerOrderWhere(scope.sellerId) : {}),
    ...(status ? { status } : {}),
  };

  const [orders, totalCount] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      select: orderSelect,
      orderBy: [{ createdAt: sortOrder }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    meta: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  };
};

const getOrder = async (
  orderId: string,
  scope: { customerId?: string; sellerId?: string } = {},
) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...(scope.customerId ? { customerId: scope.customerId } : {}),
      ...(scope.sellerId ? sellerOrderWhere(scope.sellerId) : {}),
    },
    select: orderSelect,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return order;
};

const canTransition = (
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  actorRole: UserRole,
) => {
  if (nextStatus === OrderStatus.CANCELLED) {
    return (
      actorRole === UserRole.ADMIN &&
      (currentStatus === OrderStatus.PLACED ||
        currentStatus === OrderStatus.PROCESSING)
    );
  }

  if (
    currentStatus === OrderStatus.PLACED &&
    nextStatus === OrderStatus.PROCESSING
  ) {
    return actorRole === UserRole.ADMIN || actorRole === UserRole.SELLER;
  }

  if (
    currentStatus === OrderStatus.PROCESSING &&
    nextStatus === OrderStatus.SHIPPED
  ) {
    return actorRole === UserRole.ADMIN || actorRole === UserRole.SELLER;
  }

  return (
    actorRole === UserRole.ADMIN &&
    currentStatus === OrderStatus.SHIPPED &&
    nextStatus === OrderStatus.DELIVERED
  );
};

const updateOrderStatus = async (
  orderId: string,
  nextStatus: UpdateOrderStatusInput["status"],
  actorRole: typeof UserRole.ADMIN | typeof UserRole.SELLER,
  sellerId?: string,
) => {
  if (actorRole === UserRole.SELLER && nextStatus === OrderStatus.CANCELLED) {
    throw new ApiError(403, "Sellers cannot cancel customer orders");
  }

  const ownershipFilter =
    actorRole === UserRole.SELLER && sellerId
      ? sellerOrderWhere(sellerId)
      : {};

  try {
    return await prisma.$transaction(
      async (transaction) => {
        const order = await transaction.order.findFirst({
          where: { id: orderId, ...ownershipFilter },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            orderItems: {
              select: { medicineId: true, quantity: true },
            },
          },
        });

        if (!order) {
          throw new ApiError(404, "Order not found");
        }

        if (!canTransition(order.status, nextStatus, actorRole)) {
          throw new ApiError(
            409,
            `Order cannot be changed from ${order.status} to ${nextStatus}`,
          );
        }

        if (
          nextStatus === OrderStatus.CANCELLED &&
          order.paymentStatus !== PaymentStatus.PENDING
        ) {
          throw new ApiError(
            409,
            "Only orders with pending payment can be cancelled",
          );
        }

        const updateResult = await transaction.order.updateMany({
          where: {
            id: order.id,
            status: order.status,
            ...ownershipFilter,
          },
          data: { status: nextStatus },
        });

        if (updateResult.count !== 1) {
          throw new ApiError(
            409,
            "Order status changed during this request. Please retry.",
          );
        }

        if (nextStatus === OrderStatus.CANCELLED) {
          for (const item of order.orderItems) {
            await transaction.medicine.update({
              where: { id: item.medicineId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        return transaction.order.findUniqueOrThrow({
          where: { id: order.id },
          select: orderSelect,
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    translateTransactionConflict(error);
  }
};

const cancelCustomerOrder = async (customerId: string, orderId: string) => {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const order = await transaction.order.findFirst({
          where: { id: orderId, customerId },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            orderItems: {
              select: { medicineId: true, quantity: true },
            },
          },
        });

        if (!order) {
          throw new ApiError(404, "Order not found");
        }

        if (
          order.status !== OrderStatus.PLACED ||
          order.paymentStatus !== PaymentStatus.PENDING
        ) {
          throw new ApiError(
            409,
            "Only placed orders with pending payment can be cancelled",
          );
        }

        const updateResult = await transaction.order.updateMany({
          where: {
            id: order.id,
            customerId,
            status: OrderStatus.PLACED,
            paymentStatus: PaymentStatus.PENDING,
          },
          data: { status: OrderStatus.CANCELLED },
        });

        if (updateResult.count !== 1) {
          throw new ApiError(
            409,
            "Order status changed during this request. Please retry.",
          );
        }

        for (const item of order.orderItems) {
          await transaction.medicine.update({
            where: { id: item.medicineId },
            data: { stock: { increment: item.quantity } },
          });
        }

        return transaction.order.findUniqueOrThrow({
          where: { id: order.id },
          select: orderSelect,
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    translateTransactionConflict(error);
  }
};

export const orderService = {
  createFromCart,
  listOrders,
  getOrder,
  updateOrderStatus,
  cancelCustomerOrder,
};
