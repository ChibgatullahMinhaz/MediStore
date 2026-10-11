import { z } from "zod";

const idSchema = z.string().trim().min(1).max(128);

const pageSchema = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform(Number)
  .pipe(z.number().int().min(1).max(1_000_000));

const limitSchema = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform(Number)
  .pipe(z.number().int().min(1).max(100));

const ratingSchema = z
  .union([z.string().regex(/^[1-5]$/).transform(Number), z.number().int()])
  .pipe(z.number().int().min(1).max(5));

const reviewBodyShape = {
  rating: ratingSchema,
  comment: z.string().trim().min(3).max(2000),
};

export const createReviewRequestSchema = z.object({
  params: z.object({ medicineId: idSchema }).strict(),
  body: z.object(reviewBodyShape).strict(),
});

export type CreateReviewInput = z.infer<
  typeof createReviewRequestSchema
>["body"];

export const updateReviewRequestSchema = z
  .object({
    params: z.object({ id: idSchema }).strict(),
    body: z
      .object({
        rating: ratingSchema.optional(),
        comment: reviewBodyShape.comment.optional(),
      })
      .strict(),
  })
  .refine(({ body }) => body.rating !== undefined || body.comment !== undefined, {
    path: ["body"],
    message: "Provide a rating or comment to update",
  });

export type UpdateReviewInput = z.infer<
  typeof updateReviewRequestSchema
>["body"];

export const reviewIdParamsRequestSchema = z.object({
  params: z.object({ id: idSchema }).strict(),
});

export const medicineReviewsParamsRequestSchema = z.object({
  params: z.object({ medicineId: idSchema }).strict(),
});

export const listReviewsQuerySchema = z
  .object({
    page: pageSchema.default(1),
    limit: limitSchema.default(20),
    rating: ratingSchema.optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const listReviewsRequestSchema = z.object({
  query: listReviewsQuerySchema,
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;

export const adminListReviewsQuerySchema = listReviewsQuerySchema.extend({
  medicineId: idSchema.optional(),
  customerId: idSchema.optional(),
});

export const adminListReviewsRequestSchema = z.object({
  query: adminListReviewsQuerySchema,
});

export type AdminListReviewsQuery = z.infer<
  typeof adminListReviewsQuerySchema
>;
