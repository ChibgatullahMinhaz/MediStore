import { UserRole, UserStatus } from "@/generated/prisma/enums";
import { z } from "zod";

const userIdSchema = z.string().trim().min(1).max(128);
const profileImageSchema = z.url().refine((image) => {
  const protocol = new URL(image).protocol;
  return protocol === "http:" || protocol === "https:";
});

export const userIdParamsSchema = z.object({
  params: z.object({ id: userIdSchema }),
});

export const updateProfileBodySchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(80).optional(),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[1-9]\d{6,14}$/, "Enter a valid phone number")
        .nullable()
        .optional(),
      address: z.string().trim().min(1).max(500).nullable().optional(),
      image: profileImageSchema.nullable().optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: "Provide at least one profile field to update",
    }),
});

export type UpdateProfileInput = z.infer<
  typeof updateProfileBodySchema
>["body"];

export const updateUserStatusBodySchema = z.object({
  params: z.object({ id: userIdSchema }),
  body: z
    .object({
      status: z.enum(UserStatus),
    })
    .strict(),
});

export type UpdateUserStatusInput = z.infer<
  typeof updateUserStatusBodySchema
>["body"];

const pageQuerySchema = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform(Number)
  .pipe(z.number().int().min(1).max(1_000_000));

const limitQuerySchema = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform(Number)
  .pipe(z.number().int().min(1).max(100));

export const listUsersQuerySchema = z
  .object({
    page: pageQuerySchema.default(1),
    limit: limitQuerySchema.default(20),
    search: z.string().trim().min(1).max(100).optional(),
    role: z.enum(UserRole).optional(),
    status: z.enum(UserStatus).optional(),
    sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
