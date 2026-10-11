import { OrderStatus } from "@/generated/prisma/enums";
import { z } from "zod";

const orderIdSchema = z.string().trim().min(1).max(128);

const pageSchema = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform(Number)
  .pipe(z.number().int().min(1).max(1_000_000));

const limitSchema = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform(Number)
  .pipe(z.number().int().min(1).max(100));

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{6,14}$/, "Enter a valid contact phone number");

export const createOrderRequestSchema = z.object({
  body: z
    .object({
      shippingAddress: z.string().trim().min(10).max(500),
      contactPhone: phoneSchema,
    })
    .strict(),
});

export type CreateOrderInput = z.infer<
  typeof createOrderRequestSchema
>["body"];

export const orderIdParamsRequestSchema = z.object({
  params: z.object({ id: orderIdSchema }).strict(),
});

export const listOrdersQuerySchema = z
  .object({
    page: pageSchema.default(1),
    limit: limitSchema.default(20),
    status: z.enum(OrderStatus).optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const listOrdersRequestSchema = z.object({
  query: listOrdersQuerySchema,
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const updateOrderStatusRequestSchema = z
  .object({
    params: z.object({ id: orderIdSchema }).strict(),
    body: z
      .object({
        status: z.enum([
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
          OrderStatus.CANCELLED,
        ]),
      })
      .strict(),
  });

export type UpdateOrderStatusInput = z.infer<
  typeof updateOrderStatusRequestSchema
>["body"];
