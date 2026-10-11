import { z } from "zod";

const categoryIdentifierSchema = z.string().trim().min(1).max(128);
const categoryNameSchema = z.string().trim().min(2).max(80);
const categoryDescriptionSchema = z.string().trim().min(2).max(500).nullable();

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words separated by hyphens");

export const createCategoryRequestSchema = z
  .object({
    body: z
      .object({
        name: categoryNameSchema,
        slug: slugSchema.optional(),
        description: categoryDescriptionSchema.optional(),
      })
      .strict(),
  });

export type CreateCategoryInput = z.infer<
  typeof createCategoryRequestSchema
>["body"];

export const updateCategoryRequestSchema = z
  .object({
    params: z.object({ id: categoryIdentifierSchema }).strict(),
    body: z
      .object({
        name: categoryNameSchema.optional(),
        slug: slugSchema.optional(),
        description: categoryDescriptionSchema.optional(),
      })
      .strict()
      .refine((body) => Object.keys(body).length > 0, {
        message: "Provide at least one category field to update",
      }),
  });

export type UpdateCategoryInput = z.infer<
  typeof updateCategoryRequestSchema
>["body"];

export const categoryIdParamsRequestSchema = z
  .object({
    params: z.object({ id: categoryIdentifierSchema }).strict(),
  });

const positiveIntegerQuerySchema = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform(Number)
  .pipe(z.number().int().min(1).max(1_000_000));

const categoryLimitQuerySchema = positiveIntegerQuerySchema.pipe(
  z.number().int().min(1).max(100),
);

export const listCategoriesQuerySchema = z
  .object({
    page: positiveIntegerQuerySchema.default(1),
    limit: categoryLimitQuerySchema.default(20),
    search: z.string().trim().min(1).max(100).optional(),
    sortBy: z.enum(["name", "createdAt"]).default("name"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  })
  .strict();

export const listCategoriesRequestSchema = z
  .object({ query: listCategoriesQuerySchema });

export const getCategoryParamsRequestSchema = z
  .object({
    params: z
      .object({
        idOrSlug: categoryIdentifierSchema,
      })
      .strict(),
  });

export type ListCategoriesQuery = z.infer<
  typeof listCategoriesQuerySchema
>;
