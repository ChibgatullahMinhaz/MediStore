import { z } from "zod";

const medicineIdSchema = z.string().trim().min(1).max(128);
const quantitySchema = z
  .union([z.string().regex(/^\d+$/).transform(Number), z.number().int()])
  .pipe(z.number().int().min(1).max(1_000_000));

export const addCartItemRequestSchema = z.object({
  body: z
    .object({
      medicineId: medicineIdSchema,
      quantity: quantitySchema.default(1),
    })
    .strict(),
});

export type AddCartItemInput = z.infer<
  typeof addCartItemRequestSchema
>["body"];

export const updateCartItemRequestSchema = z.object({
  params: z.object({ medicineId: medicineIdSchema }).strict(),
  body: z
    .object({
      quantity: quantitySchema,
    })
    .strict(),
});

export type UpdateCartItemInput = z.infer<
  typeof updateCartItemRequestSchema
>["body"];

export const cartItemParamsRequestSchema = z.object({
  params: z.object({ medicineId: medicineIdSchema }).strict(),
});
