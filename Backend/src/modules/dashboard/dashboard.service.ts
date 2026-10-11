import type { Prisma } from "@/generated/prisma/client";
import {
  OrderStatus,
  SellerApplicationStatus,
  UserRole,
  UserStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const recentOrderSelect = {
  id: true,
  totalAmount: true,
  status: true,
  paymentStatus: true,
  createdAt: true,
  customer: {
    select: { id: true, name: true, email: true },
  },
  orderItems: {
    select: {
      quantity: true,
      price: true,
      medicine: {
        select: {
          id: true,
          name: true,
          sellerId: true,
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

const summarizeOrderStatuses = (
  rows: Array<{ status: OrderStatus; _count: { _all: number } }>,
) => {
  const summary: Record<OrderStatus, number> = {
    [OrderStatus.PLACED]: 0,
    [OrderStatus.PROCESSING]: 0,
    [OrderStatus.SHIPPED]: 0,
    [OrderStatus.DELIVERED]: 0,
    [OrderStatus.CANCELLED]: 0,
  };

  for (const row of rows) {
    summary[row.status] = row._count._all;
  }

  return summary;
};

const getCustomerOverview = async (customerId: string) => {
  const [orderGroups, spending, recentOrders, cart] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where: { customerId },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { customerId, status: OrderStatus.DELIVERED },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: { customerId },
      select: recentOrderSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
    }),
    prisma.cart.findUnique({
      where: { userId: customerId },
      select: {
        _count: { select: { items: true } },
        items: { select: { quantity: true } },
      },
    }),
  ]);

  return {
    orders: {
      total: orderGroups.reduce((sum, row) => sum + row._count._all, 0),
      byStatus: summarizeOrderStatuses(orderGroups),
    },
    deliveredOrderValue:
      Math.round((spending._sum.totalAmount ?? 0) * 100) / 100,
    cart: {
      distinctItems: cart?._count.items ?? 0,
      itemCount:
        cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    },
    recentOrders,
  };
};

const getSellerOverview = async (sellerId: string) => {
  const orderWhere = sellerOrderWhere(sellerId);
  const [medicineCounts, orderGroups, revenue, reviewSummary, recentOrders] =
    await Promise.all([
      prisma.medicine.aggregate({
        where: { sellerId },
        _count: { _all: true },
        _sum: { stock: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: orderWhere,
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { ...orderWhere, status: OrderStatus.DELIVERED },
        _sum: { totalAmount: true },
      }),
      prisma.review.aggregate({
        where: { medicine: { sellerId } },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.order.findMany({
        where: orderWhere,
        select: recentOrderSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 5,
      }),
    ]);

  const [lowStockCount, outOfStockCount] = await Promise.all([
    prisma.medicine.count({ where: { sellerId, stock: { gt: 0, lte: 5 } } }),
    prisma.medicine.count({ where: { sellerId, stock: 0 } }),
  ]);

  return {
    inventory: {
      medicineCount: medicineCounts._count._all,
      totalStock: medicineCounts._sum.stock ?? 0,
      lowStockThreshold: 5,
      lowStockCount,
      outOfStockCount,
    },
    orders: {
      total: orderGroups.reduce((sum, row) => sum + row._count._all, 0),
      byStatus: summarizeOrderStatuses(orderGroups),
    },
    deliveredOrderValue:
      Math.round((revenue._sum.totalAmount ?? 0) * 100) / 100,
    reviews: {
      averageRating: reviewSummary._avg.rating
        ? Math.round(reviewSummary._avg.rating * 100) / 100
        : 0,
      reviewCount: reviewSummary._count._all,
    },
    recentOrders,
  };
};

const getAdminOverview = async () => {
  const [
    userGroups,
    applicationGroups,
    orderGroups,
    revenue,
    medicineCounts,
    recentOrders,
    recentUsers,
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.sellerApplication.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { status: OrderStatus.DELIVERED },
      _sum: { totalAmount: true },
    }),
    prisma.medicine.aggregate({
      _count: { _all: true },
      _sum: { stock: true },
    }),
    prisma.order.findMany({
      select: recentOrderSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
    }),
  ]);

  const userCounts: Record<UserRole, number> = {
    [UserRole.ADMIN]: 0,
    [UserRole.SELLER]: 0,
    [UserRole.CUSTOMER]: 0,
  };
  for (const row of userGroups) {
    userCounts[row.role] = row._count._all;
  }

  const applicationCounts: Record<SellerApplicationStatus, number> = {
    [SellerApplicationStatus.PENDING]: 0,
    [SellerApplicationStatus.APPROVED]: 0,
    [SellerApplicationStatus.REJECTED]: 0,
  };
  for (const row of applicationGroups) {
    applicationCounts[row.status] = row._count._all;
  }

  const [activeUsers, inactiveUsers, lowStockMedicines, outOfStockMedicines] =
    await Promise.all([
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.user.count({
        where: {
          status: { in: [UserStatus.BLOCKED, UserStatus.SUSPENDED] },
        },
      }),
      prisma.medicine.count({ where: { stock: { gt: 0, lte: 5 } } }),
      prisma.medicine.count({ where: { stock: 0 } }),
    ]);

  return {
    users: {
      total: Object.values(userCounts).reduce((sum, count) => sum + count, 0),
      byRole: userCounts,
      active: activeUsers,
      blockedOrSuspended: inactiveUsers,
    },
    sellerApplications: {
      total: Object.values(applicationCounts).reduce(
        (sum, count) => sum + count,
        0,
      ),
      byStatus: applicationCounts,
    },
    orders: {
      total: orderGroups.reduce((sum, row) => sum + row._count._all, 0),
      byStatus: summarizeOrderStatuses(orderGroups),
    },
    deliveredOrderValue:
      Math.round((revenue._sum.totalAmount ?? 0) * 100) / 100,
    inventory: {
      medicineCount: medicineCounts._count._all,
      totalStock: medicineCounts._sum.stock ?? 0,
      lowStockThreshold: 5,
      lowStockCount: lowStockMedicines,
      outOfStockCount: outOfStockMedicines,
    },
    recentOrders,
    recentUsers,
  };
};

export const dashboardService = {
  getCustomerOverview,
  getSellerOverview,
  getAdminOverview,
};
