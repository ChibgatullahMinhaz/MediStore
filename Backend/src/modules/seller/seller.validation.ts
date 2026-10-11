import { SellerApplicationStatus } from "@/generated/prisma/enums";
import path from "node:path";
import { z } from "zod";

const applicationIdSchema = z.string().trim().min(1).max(128);

const allowedLicenseExtensions: Record<string, readonly string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const isValidLicenseDocument = (
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
    file.size > 10 * 1024 * 1024
  ) {
    return false;
  }

  const extensions = allowedLicenseExtensions[file.mimetype];
  if (
    !extensions ||
    !extensions.includes(path.extname(file.originalname).toLowerCase())
  ) {
    return false;
  }

  return (
    (file.mimetype === "application/pdf" &&
      file.buffer.subarray(0, 5).toString() === "%PDF-") ||
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
      file.buffer.subarray(8, 12).toString() === "WEBP")
  );
};

const licenseDocumentSchema = z.custom<Express.Multer.File>(
  isValidLicenseDocument,
  {
    message:
      "A valid PDF, JPEG, PNG, or WEBP license document up to 10MB is required",
  },
);

export const createSellerApplicationBodySchema = z
  .object({
    body: z
      .object({
        pharmacyName: z.string().trim().min(2).max(120),
        licenseNumber: z
          .string()
          .trim()
          .min(3)
          .max(64)
          .regex(/^[A-Za-z0-9/-]+$/, "Enter a valid license number"),
        businessAddress: z.string().trim().min(10).max(500),
        contactPhone: z
          .string()
          .trim()
          .regex(/^\+?[1-9]\d{6,14}$/, "Enter a valid phone number"),
      })
      .strict(),
    file: licenseDocumentSchema,
  });

export type CreateSellerApplicationInput = z.infer<
  typeof createSellerApplicationBodySchema
>["body"];
export type ValidatedLicenseDocument = z.infer<
  typeof createSellerApplicationBodySchema
>["file"];

export const applicationIdParamsSchema = z
  .object({
    params: z.object({ id: applicationIdSchema }).strict(),
  });

const pageQuerySchema = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform(Number)
  .pipe(z.number().int().min(1).max(1_000_000));

const limitQuerySchema = z
  .union([z.string().regex(/^\d+$/), z.number().int()])
  .transform(Number)
  .pipe(z.number().int().min(1).max(100));

export const listSellerApplicationsQuerySchema = z
  .object({
    page: pageQuerySchema.default(1),
    limit: limitQuerySchema.default(20),
    status: z.enum(SellerApplicationStatus).optional(),
  })
  .strict();

export const listSellerApplicationsRequestSchema = z
  .object({ query: listSellerApplicationsQuerySchema });

export type ListSellerApplicationsQuery = z.infer<
  typeof listSellerApplicationsQuerySchema
>;

export const reviewSellerApplicationBodySchema = z
  .object({
    params: z.object({ id: applicationIdSchema }).strict(),
    body: z
      .object({
        status: z.enum([
          SellerApplicationStatus.APPROVED,
          SellerApplicationStatus.REJECTED,
        ]),
        reviewNote: z.string().trim().min(5).max(500).optional(),
      })
      .strict()
      .superRefine((body, context) => {
        if (
          body.status === SellerApplicationStatus.REJECTED &&
          !body.reviewNote
        ) {
          context.addIssue({
            code: "custom",
            path: ["reviewNote"],
            message: "A reason is required when rejecting an application",
          });
        }
      }),
  });

export type ReviewSellerApplicationInput = z.infer<
  typeof reviewSellerApplicationBodySchema
>["body"];
