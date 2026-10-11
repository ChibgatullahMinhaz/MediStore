import path from "node:path";
import { z } from "zod";

const medicineIdSchema = z.string().trim().min(1).max(128);
const categoryIdSchema = z.string().trim().min(1).max(128);
const sellerIdSchema = z.string().trim().min(1).max(128);

const positiveIntegerQuerySchema = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform(Number)
  .pipe(z.number().int().min(1).max(1_000_000));

const limitQuerySchema = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform(Number)
  .pipe(z.number().int().min(1).max(100));

const nonNegativePriceSchema = z
  .union([
    z.string().regex(/^\d+(?:\.\d{1,2})?$/).transform(Number),
    z.number(),
  ])
  .pipe(z.number().finite().min(0).max(10_000_000));

const positivePriceSchema = nonNegativePriceSchema.pipe(z.number().gt(0));

const stockSchema = z
  .union([z.string().regex(/^\d+$/).transform(Number), z.number().int()])
  .pipe(z.number().int().min(0).max(1_000_000));

const booleanSchema = z
  .union([
    z.boolean(),
    z.enum(["true", "false"]).transform((value) => value === "true"),
  ]);

const allowedImageExtensions: Record<string, readonly string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/avif": [".avif"],
  "image/gif": [".gif"],
};

const isValidMedicineImage = (
  file: unknown,
): file is Express.Multer.File => {
  if (
    typeof file !== "object" ||
    file === null ||
    !("mimetype" in file) ||
    !("originalname" in file) ||
    !("buffer" in file) ||
    !("size" in file) ||
    typeof file.mimetype !== "string" ||
    typeof file.originalname !== "string" ||
    !Buffer.isBuffer(file.buffer) ||
    typeof file.size !== "number" ||
    file.size <= 0 ||
    file.size > 5 * 1024 * 1024
  ) {
    return false;
  }

  const extensions = allowedImageExtensions[file.mimetype];
  if (
    !extensions ||
    !extensions.includes(path.extname(file.originalname).toLowerCase())
  ) {
    return false;
  }

  return (
    (file.mimetype === "image/jpeg" &&
      file.buffer[0] === 0xff &&
      file.buffer[1] === 0xd8 &&
      file.buffer[2] === 0xff) ||
    (file.mimetype === "image/png" &&
      file.buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      )) ||
    (file.mimetype === "image/webp" &&
      file.buffer.subarray(0, 4).toString() === "RIFF" &&
      file.buffer.subarray(8, 12).toString() === "WEBP") ||
    (file.mimetype === "image/gif" &&
      ["GIF87a", "GIF89a"].includes(file.buffer.subarray(0, 6).toString())) ||
    (file.mimetype === "image/avif" &&
      file.buffer.subarray(4, 12).toString().includes("ftypavif"))
  );
};

const medicineImageSchema = z.custom<Express.Multer.File>(
  isValidMedicineImage,
  {
    message: "Medicine image must be a valid JPEG, PNG, WEBP, AVIF, or GIF file up to 5MB",
  },
);

const medicineBodyShape = {
  name: z.string().trim().min(2).max(160),
  manufacturer: z.string().trim().min(2).max(120),
  price: positivePriceSchema,
  stock: stockSchema,
  description: z.string().trim().min(10).max(5000),
  categoryId: categoryIdSchema,
  isOTC: booleanSchema.optional(),
};

export const createMedicineRequestSchema = z
  .object({
    body: z.object(medicineBodyShape).strict(),
    file: medicineImageSchema.optional(),
  });

export type CreateMedicineInput = z.infer<
  typeof createMedicineRequestSchema
>["body"];

export const updateMedicineRequestSchema = z
  .object({
    params: z.object({ id: medicineIdSchema }).strict(),
    body: z
      .object({
        name: medicineBodyShape.name.optional(),
        manufacturer: medicineBodyShape.manufacturer.optional(),
        price: positivePriceSchema.optional(),
        stock: stockSchema.optional(),
        description: medicineBodyShape.description.optional(),
        categoryId: categoryIdSchema.optional(),
      isOTC: booleanSchema.optional(),
      removeImage: booleanSchema.optional(),
    })
    .strict(),
    file: medicineImageSchema.optional(),
  })
  .refine(
    ({ body, file }) =>
    (Object.keys(body).some((key) => key !== "removeImage") ||
      body.removeImage === true ||
      file !== undefined) &&
    !(body.removeImage === true && file !== undefined),
    {
    path: ["body"],
    message:
      "Provide medicine fields, upload an image, or remove the current image; do not upload and remove at once",
    },
  );

export type UpdateMedicineInput = z.infer<
  typeof updateMedicineRequestSchema
>["body"];

export const medicineIdParamsRequestSchema = z
  .object({
    params: z.object({ id: medicineIdSchema }).strict(),
  });

export const listMedicinesQuerySchema = z
  .object({
    page: positiveIntegerQuerySchema.default(1),
    limit: limitQuerySchema.default(20),
    search: z.string().trim().min(1).max(100).optional(),
    category: categoryIdSchema.optional(),
    manufacturer: z.string().trim().min(1).max(120).optional(),
    minPrice: nonNegativePriceSchema.optional(),
    maxPrice: nonNegativePriceSchema.optional(),
    inStock: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    isOTC: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    sellerId: sellerIdSchema.optional(),
    sortBy: z.enum(["name", "price", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    {
      path: ["maxPrice"],
      message: "maxPrice must be greater than or equal to minPrice",
    },
  );

export const listMedicinesRequestSchema = z
  .object({ query: listMedicinesQuerySchema });

export type ListMedicinesQuery = z.infer<typeof listMedicinesQuerySchema>;
