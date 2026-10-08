var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

// src/config/env.ts
import dotenv from "dotenv";
dotenv.config();
var env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5e3,
  DATABASE_URL: process.env.DATABASE_URL || "",
  DIRECT_URL: process.env.DIRECT_URL || "",
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL || "",
    PASSWORD: process.env.ADMIN_PASSWORD || "",
    NAME: process.env.ADMIN_NAME || "Admin User"
  },
  R2: {
    REGION: process.env.R2_REGION || "auto",
    ENDPOINT: process.env.R2_ENDPOINT || "",
    ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || "",
    SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || "",
    BUCKET: process.env.R2_BUCKET || "",
    PRESIGNED_EXPIRES_IN: Number(process.env.R2_PRESIGNED_EXPIRES_IN) || 3600
  }
};
if (!env.DATABASE_URL && env.NODE_ENV === "production") {
  console.warn(
    "\u26A0\uFE0F WARNING: DATABASE_URL is not defined in environment variables!"
  );
}
if (!env.BETTER_AUTH_SECRET && env.NODE_ENV === "production") {
  console.warn(
    "\u26A0\uFE0F WARNING: BETTER_AUTH_SECRET is not defined in environment variables!"
  );
}

// src/constants/origin.ts
var trustedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:8086",
  "https://api.v1.ms-shop.store",
  "https://ms-shop.store",
  "https://admin.ms-shop.store",
  "https://ms-shop-admin.web.app",
  env.APP_URL
].filter((origin, index, origins) => origins.indexOf(origin) === index);

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// src/lib/prisma.ts
import "dotenv/config";
import { env as env2 } from "process";
import { PrismaPg } from "@prisma/adapter-pg";

// src/generated/prisma/client.ts
import "process";
import * as path from "path";
import { fileURLToPath } from "url";
import "@prisma/client/runtime/client";

// src/generated/prisma/enums.ts
var UserRole = {
  ADMIN: "ADMIN",
  SELLER: "SELLER",
  CUSTOMER: "CUSTOMER"
};
var UserStatus = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
  SUSPENDED: "SUSPENDED"
};

// src/generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.10.0",
  "engineVersion": "0edf323efd1d98336f3f0a68684b56f689b900d3",
  "activeProvider": "postgresql",
  "inlineSchema": 'model Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String   @unique\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("sessions")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("accounts")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verifications")\n}\n\nmodel Category {\n  id          String   @id @default(cuid())\n  name        String   @unique\n  slug        String   @unique\n  description String?\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  medicines Medicine[]\n\n  @@map("categories")\n}\n\nmodel Medicine {\n  id           String  @id @default(cuid())\n  name         String\n  manufacturer String\n  price        Float\n  stock        Int     @default(0)\n  description  String\n  imageUrl     String?\n  isOTC        Boolean @default(true) // Over-the-counter status\n\n  categoryId String\n  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n\n  sellerId String\n  seller   User   @relation(fields: [sellerId], references: [id], onDelete: Cascade)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  orderItems OrderItem[]\n  reviews    Review[]\n\n  @@map("medicines")\n}\n\nenum UserRole {\n  ADMIN\n  SELLER\n  CUSTOMER\n}\n\nenum UserStatus {\n  ACTIVE\n  BLOCKED\n  SUSPENDED\n}\n\nenum OrderStatus {\n  PLACED\n  PROCESSING\n  SHIPPED\n  DELIVERED\n  CANCELLED\n}\n\nenum PaymentStatus {\n  PENDING\n  PAID\n  FAILED\n}\n\nmodel Order {\n  id              String        @id @default(cuid())\n  totalAmount     Float\n  status          OrderStatus   @default(PLACED)\n  paymentStatus   PaymentStatus @default(PENDING)\n  shippingAddress String\n  contactPhone    String\n\n  customerId String\n  customer   User   @relation(fields: [customerId], references: [id], onDelete: Cascade)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  orderItems OrderItem[]\n\n  @@map("orders")\n}\n\nmodel OrderItem {\n  id       String @id @default(cuid())\n  quantity Int\n  price    Float // Product price at the time of order\n\n  orderId String\n  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  medicineId String\n  medicine   Medicine @relation(fields: [medicineId], references: [id], onDelete: Restrict)\n\n  @@map("order_items")\n}\n\nmodel Review {\n  id      String @id @default(cuid())\n  rating  Int // 1 to 5\n  comment String\n\n  customerId String\n  customer   User   @relation(fields: [customerId], references: [id], onDelete: Cascade)\n\n  medicineId String\n  medicine   Medicine @relation(fields: [medicineId], references: [id], onDelete: Cascade)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@map("reviews")\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel User {\n  id            String     @id @default(cuid())\n  name          String\n  email         String     @unique\n  emailVerified Boolean    @default(false)\n  image         String?\n  password      String?\n  role          UserRole   @default(CUSTOMER)\n  status        UserStatus @default(ACTIVE)\n  phone         String?\n  address       String?\n  createdAt     DateTime   @default(now())\n  updatedAt     DateTime   @updatedAt\n\n  medicines Medicine[] // A seller can list multiple medicines\n  orders    Order[] // A customer can place multiple orders\n  reviews   Review[] // A customer can leave reviews\n  sessions  Session[]\n  accounts  Account[]\n\n  @@map("users")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"sessions","schema":null},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"accounts","schema":null},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verifications","schema":null},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"CategoryToMedicine"}],"dbName":"categories","schema":null},"Medicine":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"manufacturer","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Float"},{"name":"stock","kind":"scalar","type":"Int"},{"name":"description","kind":"scalar","type":"String"},{"name":"imageUrl","kind":"scalar","type":"String"},{"name":"isOTC","kind":"scalar","type":"Boolean"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToMedicine"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"seller","kind":"object","type":"User","relationName":"MedicineToUser"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"MedicineToOrderItem"},{"name":"reviews","kind":"object","type":"Review","relationName":"MedicineToReview"}],"dbName":"medicines","schema":null},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"totalAmount","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"paymentStatus","kind":"enum","type":"PaymentStatus"},{"name":"shippingAddress","kind":"scalar","type":"String"},{"name":"contactPhone","kind":"scalar","type":"String"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"}],"dbName":"orders","schema":null},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"price","kind":"scalar","type":"Float"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToOrderItem"}],"dbName":"order_items","schema":null},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToReview"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"reviews","schema":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"phone","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"MedicineToUser"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"}],"dbName":"users","schema":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","medicines","_count","category","seller","customer","orderItems","order","medicine","reviews","orders","sessions","user","accounts","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","data","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","create","update","Session.upsertOne","Session.deleteOne","Session.deleteMany","having","_min","_max","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","Category.upsertOne","Category.deleteOne","Category.deleteMany","Category.groupBy","Category.aggregate","Medicine.findUnique","Medicine.findUniqueOrThrow","Medicine.findFirst","Medicine.findFirstOrThrow","Medicine.findMany","Medicine.createOne","Medicine.createMany","Medicine.createManyAndReturn","Medicine.updateOne","Medicine.updateMany","Medicine.updateManyAndReturn","Medicine.upsertOne","Medicine.deleteOne","Medicine.deleteMany","_avg","_sum","Medicine.groupBy","Medicine.aggregate","Order.findUnique","Order.findUniqueOrThrow","Order.findFirst","Order.findFirstOrThrow","Order.findMany","Order.createOne","Order.createMany","Order.createManyAndReturn","Order.updateOne","Order.updateMany","Order.updateManyAndReturn","Order.upsertOne","Order.deleteOne","Order.deleteMany","Order.groupBy","Order.aggregate","OrderItem.findUnique","OrderItem.findUniqueOrThrow","OrderItem.findFirst","OrderItem.findFirstOrThrow","OrderItem.findMany","OrderItem.createOne","OrderItem.createMany","OrderItem.createManyAndReturn","OrderItem.updateOne","OrderItem.updateMany","OrderItem.updateManyAndReturn","OrderItem.upsertOne","OrderItem.deleteOne","OrderItem.deleteMany","OrderItem.groupBy","OrderItem.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","AND","OR","NOT","id","name","email","emailVerified","image","password","UserRole","role","UserStatus","status","phone","address","createdAt","updatedAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","every","some","none","rating","comment","customerId","medicineId","quantity","price","orderId","totalAmount","OrderStatus","PaymentStatus","paymentStatus","shippingAddress","contactPhone","manufacturer","stock","description","imageUrl","isOTC","categoryId","sellerId","slug","identifier","value","expiresAt","accountId","providerId","userId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","token","ipAddress","userAgent","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "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_gIAIdQBAQDBAgAh1QECAO8CACHWAQEAwQIAIdcBAQDDAgAh2AEgAMICACHZAQEAwQIAIdoBAQDBAgAhAgAAAAUAIBUAAI0BACAMqwEBAMECACGsAQEAwQIAIbcBQADGAgAhuAFAAMYCACHMAQgA_gIAIdQBAQDBAgAh1QECAO8CACHWAQEAwQIAIdcBAQDDAgAh2AEgAMICACHZAQEAwQIAIdoBAQDBAgAhAgAAAAMAIBUAAI8BACACAAAAAwAgFQAAjwEAIAMAAAAFACAcAACIAQAgHQAAjQEAIAEAAAAFACABAAAAAwAgBgQAANYDACAiAADZAwAgIwAA2AMAIGQAANcDACBlAADaAwAg1wEAAL0CACAPqAEAAKMCADCpAQAAlgEAEKoBAACjAgAwqwEBAPUBACGsAQEA9QEAIbcBQAD6AQAhuAFAAPoBACHMAQgAmgIAIdQBAQD1AQAh1QECAJYCACHWAQEA9QEAIdcBAQD3AQAh2AEgAPYBACHZAQEA9QEAIdoBAQD1AQAhAwAAAAMAIAEAAJUBADAhAACWAQAgAwAAAAMAIAEAAAQAMAIAAAUAIAEAAAAXACABAAAAFwAgAwAAABUAIAEAABYAMAIAABcAIAMAAAAVACABAAAWADACAAAXACADAAAAFQAgAQAAFgAwAgAAFwAgCwcAANUDACAIAACSAwAgqwEBAAAAAbQBAAAA0AECtwFAAAAAAbgBQAAAAAHJAQEAAAABzgEIAAAAAdEBAAAA0QEC0gEBAAAAAdMBAQAAAAEBFQAAngEAIAmrAQEAAAABtAEAAADQAQK3AUAAAAABuAFAAAAAAckBAQAAAAHOAQgAAAAB0QEAAADRAQLSAQEAAAAB0wEBAAAAAQEVAACgAQAwARUAAKABADALBwAA1AMAIAgAAIIDACCrAQEAwQIAIbQBAAD_AtABIrcBQADGAgAhuAFAAMYCACHJAQEAwQIAIc4BCAD-AgAh0QEAAIAD0QEi0gEBAMECACHTAQEAwQIAIQIAAAAXACAVAACjAQAgCasBAQDBAgAhtAEAAP8C0AEitwFAAMYCACG4AUAAxgIAIckBAQDBAgAhzgEIAP4CACHRAQAAgAPRASLSAQEAwQIAIdMBAQDBAgAhAgAAABUAIBUAAKUBACACAAAAFQAgFQAApQEAIAMAAAAXACAcAACeAQAgHQAAowEAIAEAAAAXACABAAAAFQAgBQQAAM8DACAiAADSAwAgIwAA0QMAIGQAANADACBlAADTAwAgDKgBAACcAgAwqQEAAKwBABCqAQAAnAIAMKsBAQD1AQAhtAEAAJ0C0AEitwFAAPoBACG4AUAA-gEAIckBAQD1AQAhzgEIAJoCACHRAQAAngLRASLSAQEA9QEAIdMBAQD1AQAhAwAAABUAIAEAAKsBADAhAACsAQAgAwAAABUAIAEAABYAMAIAABcAIAEAAAALACABAAAACwAgAwAAAAkAIAEAAAoAMAIAAAsAIAMAAAAJACABAAAKADACAAALACADAAAACQAgAQAACgAwAgAACwAgBwkAALYDACAKAACQAwAgqwEBAAAAAcoBAQAAAAHLAQIAAAABzAEIAAAAAc0BAQAAAAEBFQAAtAEAIAWrAQEAAAABygEBAAAAAcsBAgAAAAHMAQgAAAABzQEBAAAAAQEVAAC2AQAwARUAALYBADAHCQAAtAMAIAoAAI4DACCrAQEAwQIAIcoBAQDBAgAhywECAO8CACHMAQgA_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-AGyASK0AQAA-QG0ASK1AQEA9wEAIbYBAQD3AQAhtwFAAPoBACG4AUAA-gEAIQMAAADeAQAgAQAA8AEAMCEAAPEBACADAAAA3gEAIAEAAN8BADACAADbAQAgD6gBAAD0AQAwqQEAAPEBABCqAQAA9AEAMKsBAQD1AQAhrAEBAPUBACGtAQEA9QEAIa4BIAD2AQAhrwEBAPcBACGwAQEA9wEAIbIBAAD4AbIBIrQBAAD5AbQBIrUBAQD3AQAhtgEBAPcBACG3AUAA-gEAIbgBQAD6AQAhDgQAAPwBACAiAACIAgAgIwAAiAIAILkBAQAAAAG6AQEAAAAEuwEBAAAABLwBAQAAAAG9AQEAAAABvgEBAAAAAb8BAQAAAAHAAQEAhwIAIcEBAQAAAAHCAQEAAAABwwEBAAAAAQUEAAD8AQAgIgAAhgIAICMAAIYCACC5ASAAAAABwAEgAIUCACEOBAAAgwIAICIAAIQCACAjAACEAgAguQEBAAAAAboBAQAAAAW7AQEAAAAFvAEBAAAAAb0BAQAAAAG-AQEAAAABvwEBAAAAAcABAQCCAgAhwQEBAAAAAcIBAQAAAAHDAQEAAAABBwQAAPwBACAiAACBAgAgIwAAgQIAILkBAAAAsgECugEAAACyAQi7AQAAALIBCMABAACAArIBIgcEAAD8AQAgIgAA_wEAICMAAP8BACC5AQAAALQBAroBAAAAtAEIuwEAAAC0AQjAAQAA_gG0ASILBAAA_AEAICIAAP0BACAjAAD9AQAguQFAAAAAAboBQAAAAAS7AUAAAAAEvAFAAAAAAb0BQAAAAAG-AUAAAAABvwFAAAAAAcABQAD7AQAhCwQAAPwBACAiAAD9AQAgIwAA_QEAILkBQAAAAAG6AUAAAAAEuwFAAAAABLwBQAAAAAG9AUAAAAABvgFAAAAAAb8BQAAAAAHAAUAA-wEAIQi5AQIAAAABugECAAAABLsBAgAAAAS8AQIAAAABvQECAAAAAb4BAgAAAAG_AQIAAAABwAECAPwBACEIuQFAAAAAAboBQAAAAAS7AUAAAAAEvAFAAAAAAb0BQAAAAAG-AUAAAAABvwFAAAAAAcABQAD9AQAhBwQAAPwBACAiAAD_AQAgIwAA_wEAILkBAAAAtAECugEAAAC0AQi7AQAAALQBCMABAAD-AbQBIgS5AQAAALQBAroBAAAAtAEIuwEAAAC0AQjAAQAA_wG0ASIHBAAA_AEAICIAAIECACAjAACBAgAguQEAAACyAQK6AQAAALIBCLsBAAAAsgEIwAEAAIACsgEiBLkBAAAAsgECugEAAACyAQi7AQAAALIBCMABAACBArIBIg4EAACDAgAgIgAAhAIAICMAAIQCACC5AQEAAAABugEBAAAABbsBAQAAAAW8AQEAAAABvQEBAAAAAb4BAQAAAAG_AQEAAAABwAEBAIICACHBAQEAAAABwgEBAAAAAcMBAQAAAAEIuQECAAAAAboBAgAAAAW7AQIAAAAFvAECAAAAAb0BAgAAAAG-AQIAAAABvwECAAAAAcABAgCDAgAhC7kBAQAAAAG6AQEAAAAFuwEBAAAABbwBAQAAAAG9AQEAAAABvgEBAAAAAb8BAQAAAAHAAQEAhAIAIcEBAQAAAAHCAQEAAAABwwEBAAAAAQUEAAD8AQAgIgAAhgIAICMAAIYCACC5ASAAAAABwAEgAIUCACECuQEgAAAAAcABIACGAgAhDgQAAPwBACAiAACIAgAgIwAAiAIAILkBAQAAAAG6AQEAAAAEuwEBAAAABLwBAQAAAAG9AQEAAAABvgEBAAAAAb8BAQAAAAHAAQEAhwIAIcEBAQAAAAHCAQEAAAABwwEBAAAAAQu5AQEAAAABugEBAAAABLsBAQAAAAS8AQEAAAABvQEBAAAAAb4BAQAAAAG_AQEAAAABwAEBAIgCACHBAQEAAAABwgEBAAAAAcMBAQAAAAEUAwAAkAIAIAsAAJICACAMAACRAgAgDQAAkwIAIA8AAJQCACCoAQAAiQIAMKkBAADeAQAQqgEAAIkCADCrAQEAigIAIawBAQCKAgAhrQEBAIoCACGuASAAiwIAIa8BAQCMAgAhsAEBAIwCACGyAQAAjQKyASK0AQAAjgK0ASK1AQEAjAIAIbYBAQCMAgAhtwFAAI8CACG4AUAAjwIAIQu5AQEAAAABugEBAAAABLsBAQAAAAS8AQEAAAABvQEBAAAAAb4BAQAAAAG_AQEAAAABwAEBAIgCACHBAQEAAAABwgEBAAAAAcMBAQAAAAECuQEgAAAAAcABIACGAgAhC7kBAQAAAAG6AQEAAAAFuwEBAAAABbwBAQAAAAG9AQEAAAABvgEBAAAAAb8BAQAAAAHAAQEAhAIAIcEBAQAAAAHCAQEAAAABwwEBAAAAAQS5AQAAALIBAroBAAAAsgEIuwEAAACyAQjAAQAAgQKyASIEuQEAAAC0AQK6AQAAALQBCLsBAAAAtAEIwAEAAP8BtAEiCLkBQAAAAAG6AUAAAAAEuwFAAAAABLwBQAAAAAG9AUAAAAABvgFAAAAAAb8BQAAAAAHAAUAA_QEAIQPEAQAAAwAgxQEAAAMAIMYBAAADACADxAEAABUAIMUBAAAVACDGAQAAFQAgA8QBAAAPACDFAQAADwAgxgEAAA8AIAPEAQAAGgAgxQEAABoAIMYBAAAaACADxAEAAB0AIMUBAAAdACDGAQAAHQAgCqgBAACVAgAwqQEAANgBABCqAQAAlQIAMKsBAQD1AQAhtwFAAPoBACG4AUAA-gEAIccBAgCWAgAhyAEBAPUBACHJAQEA9QEAIcoBAQD1AQAhDQQAAPwBACAiAAD8AQAgIwAA_AEAIGQAAJgCACBlAAD8AQAguQECAAAAAboBAgAAAAS7AQIAAAAEvAECAAAAAb0BAgAAAAG-AQIAAAABvwECAAAAAcABAgCXAgAhDQQAAPwBACAiAAD8AQAgIwAA_AEAIGQAAJgCACBlAAD8AQAguQECAAAAAboBAgAAAAS7AQIAAAAEvAECAAAAAb0BAgAAAAG-AQIAAAABvwECAAAAAcABAgCXAgAhCLkBCAAAAAG6AQgAAAAEuwEIAAAABLwBCAAAAAG9AQgAAAABvgEIAAAAAb8BCAAAAAHAAQgAmAIAIQioAQAAmQIAMKkBAADCAQAQqgEAAJkCADCrAQEA9QEAIcoBAQD1AQAhywECAJYCACHMAQgAmgIAIc0BAQD1AQAhDQQAAPwBACAiAACYAgAgIwAAmAIAIGQAAJgCACBlAACYAgAguQEIAAAAAboBCAAAAAS7AQgAAAAEvAEIAAAAAb0BCAAAAAG-AQgAAAABvwEIAAAAAcABCACbAgAhDQQAAPwBACAiAACYAgAgIwAAmAIAIGQAAJgCACBlAACYAgAguQEIAAAAAboBCAAAAAS7AQgAAAAEvAEIAAAAAb0BCAAAAAG-AQgAAAABvwEIAAAAAcABCACbAgAhDKgBAACcAgAwqQEAAKwBABCqAQAAnAIAMKsBAQD1AQAhtAEAAJ0C0AEitwFAAPoBACG4AUAA-gEAIckBAQD1AQAhzgEIAJoCACHRAQAAngLRASLSAQEA9QEAIdMBAQD1AQAhBwQAAPwBACAiAACiAgAgIwAAogIAILkBAAAA0AECugEAAADQAQi7AQAAANABCMABAAChAtABIgcEAAD8AQAgIgAAoAIAICMAAKACACC5AQAAANEBAroBAAAA0QEIuwEAAADRAQjAAQAAnwLRASIHBAAA_AEAICIAAKACACAjAACgAgAguQEAAADRAQK6AQAAANEBCLsBAAAA0QEIwAEAAJ8C0QEiBLkBAAAA0QECugEAAADRAQi7AQAAANEBCMABAACgAtEBIgcEAAD8AQAgIgAAogIAICMAAKICACC5AQAAANABAroBAAAA0AEIuwEAAADQAQjAAQAAoQLQASIEuQEAAADQAQK6AQAAANABCLsBAAAA0AEIwAEAAKIC0AEiD6gBAACjAgAwqQEAAJYBABCqAQAAowIAMKsBAQD1AQAhrAEBAPUBACG3AUAA-gEAIbgBQAD6AQAhzAEIAJoCACHUAQEA9QEAIdUBAgCWAgAh1gEBAPUBACHXAQEA9wEAIdgBIAD2AQAh2QEBAPUBACHaAQEA9QEAIQmoAQAApAIAMKkBAACAAQAQqgEAAKQCADCrAQEA9QEAIawBAQD1AQAhtwFAAPoBACG4AUAA-gEAIdYBAQD3AQAh2wEBAPUBACEKAwAAkAIAIKgBAAClAgAwqQEAAG0AEKoBAAClAgAwqwEBAIoCACGsAQEAigIAIbcBQACPAgAhuAFAAI8CACHWAQEAjAIAIdsBAQCKAgAhCagBAACmAgAwqQEAAGcAEKoBAACmAgAwqwEBAPUBACG3AUAA-gEAIbgBQAD6AQAh3AEBAPUBACHdAQEA9QEAId4BQAD6AQAhCagBAACnAgAwqQEAAFQAEKoBAACnAgAwqwEBAIoCACG3AUAAjwIAIbgBQACPAgAh3AEBAIoCACHdAQEAigIAId4BQACPAgAhEKgBAACoAgAwqQEAAE4AEKoBAACoAgAwqwEBAPUBACGwAQEA9wEAIbcBQAD6AQAhuAFAAPoBACHfAQEA9QEAIeABAQD1AQAh4QEBAPUBACHiAQEA9wEAIeMBAQD3AQAh5AEBAPcBACHlAUAAqQIAIeYBQACpAgAh5wEBAPcBACELBAAAgwIAICIAAKsCACAjAACrAgAguQFAAAAAAboBQAAAAAW7AUAAAAAFvAFAAAAAAb0BQAAAAAG-AUAAAAABvwFAAAAAAcABQACqAgAhCwQAAIMCACAiAACrAgAgIwAAqwIAILkBQAAAAAG6AUAAAAAFuwFAAAAABbwBQAAAAAG9AUAAAAABvgFAAAAAAb8BQAAAAAHAAUAAqgIAIQi5AUAAAAABugFAAAAABbsBQAAAAAW8AUAAAAABvQFAAAAAAb4BQAAAAAG_AUAAAAABwAFAAKsCACELqAEAAKwCADCpAQAAOAAQqgEAAKwCADCrAQEA9QEAIbcBQAD6AQAhuAFAAPoBACHeAUAA-gEAIeEBAQD1AQAh6AEBAPUBACHpAQEA9wEAIeoBAQD3AQAhEQ4AAK8CACCoAQAArQIAMKkBAAAdABCqAQAArQIAMKsBAQCKAgAhsAEBAIwCACG3AUAAjwIAIbgBQACPAgAh3wEBAIoCACHgAQEAigIAIeEBAQCKAgAh4gEBAIwCACHjAQEAjAIAIeQBAQCMAgAh5QFAAK4CACHmAUAArgIAIecBAQCMAgAhCLkBQAAAAAG6AUAAAAAFuwFAAAAABbwBQAAAAAG9AUAAAAABvgFAAAAAAb8BQAAAAAHAAUAAqwIAIRYDAACQAgAgCwAAkgIAIAwAAJECACANAACTAgAgDwAAlAIAIKgBAACJAgAwqQEAAN4BABCqAQAAiQIAMKsBAQCKAgAhrAEBAIoCACGtAQEAigIAIa4BIACLAgAhrwEBAIwCACGwAQEAjAIAIbIBAACNArIBIrQBAACOArQBIrUBAQCMAgAhtgEBAIwCACG3AUAAjwIAIbgBQACPAgAh6wEAAN4BACDsAQAA3gEAIAwOAACvAgAgqAEAALACADCpAQAAGgAQqgEAALACADCrAQEAigIAIbcBQACPAgAhuAFAAI8CACHeAUAAjwIAIeEBAQCKAgAh6AEBAIoCACHpAQEAjAIAIeoBAQCMAgAhDgcAAK8CACAIAAC1AgAgqAEAALECADCpAQAAFQAQqgEAALECADCrAQEAigIAIbQBAACzAtABIrcBQACPAgAhuAFAAI8CACHJAQEAigIAIc4BCACyAgAh0QEAALQC0QEi0gEBAIoCACHTAQEAigIAIQi5AQgAAAABugEIAAAABLsBCAAAAAS8AQgAAAABvQEIAAAAAb4BCAAAAAG_AQgAAAABwAEIAJgCACEEuQEAAADQAQK6AQAAANABCLsBAAAA0AEIwAEAAKIC0AEiBLkBAAAA0QECugEAAADRAQi7AQAAANEBCMABAACgAtEBIgPEAQAACQAgxQEAAAkAIMYBAAAJACAMBwAArwIAIAoAALgCACCoAQAAtgIAMKkBAAAPABCqAQAAtgIAMKsBAQCKAgAhtwFAAI8CACG4AUAAjwIAIccBAgC3AgAhyAEBAIoCACHJAQEAigIAIcoBAQCKAgAhCLkBAgAAAAG6AQIAAAAEuwECAAAABLwBAgAAAAG9AQIAAAABvgECAAAAAb8BAgAAAAHAAQIA_AEAIRUFAAC8AgAgBgAArwIAIAgAALUCACALAACSAgAgqAEAALsCADCpAQAAAwAQqgEAALsCADCrAQEAigIAIawBAQCKAgAhtwFAAI8CACG4AUAAjwIAIcwBCACyAgAh1AEBAIoCACHVAQIAtwIAIdYBAQCKAgAh1wEBAIwCACHYASAAiwIAIdkBAQCKAgAh2gEBAIoCACHrAQAAAwAg7AEAAAMAIAoJAAC6AgAgCgAAuAIAIKgBAAC5AgAwqQEAAAkAEKoBAAC5AgAwqwEBAIoCACHKAQEAigIAIcsBAgC3AgAhzAEIALICACHNAQEAigIAIRAHAACvAgAgCAAAtQIAIKgBAACxAgAwqQEAABUAEKoBAACxAgAwqwEBAIoCACG0AQAAswLQASK3AUAAjwIAIbgBQACPAgAhyQEBAIoCACHOAQgAsgIAIdEBAAC0AtEBItIBAQCKAgAh0wEBAIoCACHrAQAAFQAg7AEAABUAIBMFAAC8AgAgBgAArwIAIAgAALUCACALAACSAgAgqAEAALsCADCpAQAAAwAQqgEAALsCADCrAQEAigIAIawBAQCKAgAhtwFAAI8CACG4AUAAjwIAIcwBCACyAgAh1AEBAIoCACHVAQIAtwIAIdYBAQCKAgAh1wEBAIwCACHYASAAiwIAIdkBAQCKAgAh2gEBAIoCACEMAwAAkAIAIKgBAAClAgAwqQEAAG0AEKoBAAClAgAwqwEBAIoCACGsAQEAigIAIbcBQACPAgAhuAFAAI8CACHWAQEAjAIAIdsBAQCKAgAh6wEAAG0AIOwBAABtACAAAAAAAfABAQAAAAEB8AEgAAAAAQHwAQEAAAABAfABAAAAsgECAfABAAAAtAECAfABQAAAAAELHAAAkwMAMB0AAJgDADDtAQAAlAMAMO4BAACVAwAw7wEAAJYDACDwAQAAlwMAMPEBAACXAwAw8gEAAJcDADDzAQAAlwMAMPQBAACZAwAw9QEAAJoDADALHAAA9AIAMB0AAPkCADDtAQAA9QIAMO4BAAD2AgAw7wEAAPcCACDwAQAA-AIAMPEBAAD4AgAw8gEAAPgCADDzAQAA-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_AIAIBUAAP0CACAMqAEAAPsCADCpAQAA_AIAEKoBAAD7AgAwqwEBAIoCACG0AQAAswLQASK3AUAAjwIAIbgBQACPAgAhyQEBAIoCACHOAQgAsgIAIdEBAAC0AtEBItIBAQCKAgAh0wEBAIoCACEMqAEAAPsCADCpAQAA_AIAEKoBAAD7AgAwqwEBAIoCACG0AQAAswLQASK3AUAAjwIAIbgBQACPAgAhyQEBAIoCACHOAQgAsgIAIdEBAAC0AtEBItIBAQCKAgAh0wEBAIoCACEIqwEBAMECACG0AQAA_wLQASK3AUAAxgIAIbgBQADGAgAhzgEIAP4CACHRAQAAgAPRASLSAQEAwQIAIdMBAQDBAgAhBfABCAAAAAH2AQgAAAAB9wEIAAAAAfgBCAAAAAH5AQgAAAABAfABAAAA0AECAfABAAAA0QECCQgAAIIDACCrAQEAwQIAIbQBAAD_AtABIrcBQADGAgAhuAFAAMYCACHOAQgA_gIAIdEBAACAA9EBItIBAQDBAgAh0wEBAMECACELHAAAgwMAMB0AAIgDADDtAQAAhAMAMO4BAACFAwAw7wEAAIYDACDwAQAAhwMAMPEBAACHAwAw8gEAAIcDADDzAQAAhwMAMPQBAACJAwAw9QEAAIoDADAFCgAAkAMAIKsBAQAAAAHKAQEAAAABywECAAAAAcwBCAAAAAECAAAACwAgHAAAjwMAIAMAAAALACAcAACPAwAgHQAAjQMAIAEVAACpBAAwCgkAALoCACAKAAC4AgAgqAEAALkCADCpAQAACQAQqgEAALkCADCrAQEAAAABygEBAIoCACHLAQIAtwIAIcwBCACyAgAhzQEBAIoCACECAAAACwAgFQAAjQMAIAIAAACLAwAgFQAAjAMAIAioAQAAigMAMKkBAACLAwAQqgEAAIoDADCrAQEAigIAIcoBAQCKAgAhywECALcCACHMAQgAsgIAIc0BAQCKAgAhCKgBAACKAwAwqQEAAIsDABCqAQAAigMAMKsBAQCKAgAhygEBAIoCACHLAQIAtwIAIcwBCACyAgAhzQEBAIoCACEEqwEBAMECACHKAQEAwQIAIcsBAgDvAgAhzAEIAP4CACEFCgAAjgMAIKsBAQDBAgAhygEBAMECACHLAQIA7wIAIcwBCAD-AgAhBRwAAKQEACAdAACnBAAg7QEAAKUEACDuAQAApgQAIPMBAAAFACAFCgAAkAMAIKsBAQAAAAHKAQEAAAABywECAAAAAcwBCAAAAAEDHAAApAQAIO0BAAClBAAg8wEAAAUAIAkIAACSAwAgqwEBAAAAAbQBAAAA0AECtwFAAAAAAbgBQAAAAAHOAQgAAAAB0QEAAADRAQLSAQEAAAAB0wEBAAAAAQQcAACDAwAw7QEAAIQDADDvAQAAhgMAIPMBAACHAwAwDgUAALgDACAIAAC5AwAgCwAAugMAIKsBAQAAAAGsAQEAAAABtwFAAAAAAbgBQAAAAAHMAQgAAAAB1AEBAAAAAdUBAgAAAAHWAQEAAAAB1wEBAAAAAdgBIAAAAAHZAQEAAAABAgAAAAUAIBwAALcDACADAAAABQAgHAAAtwMAIB0AAJ0DACABFQAAowQAMBMFAAC8AgAgBgAArwIAIAgAALUCACALAACSAgAgqAEAALsCADCpAQAAAwAQqgEAALsCADCrAQEAAAABrAEBAIoCACG3AUAAjwIAIbgBQACPAgAhzAEIALICACHUAQEAigIAIdUBAgC3AgAh1gEBAIoCACHXAQEAjAIAIdgBIACLAgAh2QEBAIoCACHaAQEAigIAIQIAAAAFACAVAACdAwAgAgAAAJsDACAVAACcAwAgD6gBAACaAwAwqQEAAJsDABCqAQAAmgMAMKsBAQCKAgAhrAEBAIoCACG3AUAAjwIAIbgBQACPAgAhzAEIALICACHUAQEAigIAIdUBAgC3AgAh1gEBAIoCACHXAQEAjAIAIdgBIACLAgAh2QEBAIoCACHaAQEAigIAIQ-oAQAAmgMAMKkBAACbAwAQqgEAAJoDADCrAQEAigIAIawBAQCKAgAhtwFAAI8CACG4AUAAjwIAIcwBCACyAgAh1AEBAIoCACHVAQIAtwIAIdYBAQCKAgAh1wEBAIwCACHYASAAiwIAIdkBAQCKAgAh2gEBAIoCACELqwEBAMECACGsAQEAwQIAIbcBQADGAgAhuAFAAMYCACHMAQgA_gIAIdQBAQDBAgAh1QECAO8CACHWAQEAwQIAIdcBAQDDAgAh2AEgAMICACHZAQEAwQIAIQ4FAACeAwAgCAAAnwMAIAsAAKADACCrAQEAwQIAIawBAQDBAgAhtwFAAMYCACG4AUAAxgIAIcwBCAD-AgAh1AEBAMECACHVAQIA7wIAIdYBAQDBAgAh1wEBAMMCACHYASAAwgIAIdkBAQDBAgAhBRwAAJIEACAdAAChBAAg7QEAAJMEACDuAQAAoAQAIPMBAABqACALHAAArAMAMB0AALADADDtAQAArQMAMO4BAACuAwAw7wEAAK8DACDwAQAAhwMAMPEBAACHAwAw8gEAAIcDADDzAQAAhwMAMPQBAACxAwAw9QEAAIoDADALHAAAoQMAMB0AAKUDADDtAQAAogMAMO4BAACjAwAw7wEAAKQDACDwAQAA6QIAMPEBAADpAgAw8gEAAOkCADDzAQAA6QIAMPQBAACmAwAw9QEAAOwCADAHBwAAqwMAIKsBAQAAAAG3AUAAAAABuAFAAAAAAccBAgAAAAHIAQEAAAAByQEBAAAAAQIAAAARACAcAACqAwAgAwAAABEAIBwAAKoDACAdAACoAwAgARUAAJ8EADACAAAAEQAgFQAAqAMAIAIAAADtAgAgFQAApwMAIAarAQEAwQIAIbcBQADGAgAhuAFAAMYCACHHAQIA7wIAIcgBAQDBAgAhyQEBAMECACEHBwAAqQMAIKsBAQDBAgAhtwFAAMYCACG4AUAAxgIAIccBAgDvAgAhyAEBAMECACHJAQEAwQIAIQUcAACaBAAgHQAAnQQAIO0BAACbBAAg7gEAAJwEACDzAQAA2wEAIAcHAACrAwAgqwEBAAAAAbcBQAAAAAG4AUAAAAABxwECAAAAAcgBAQAAAAHJAQEAAAABAxwAAJoEACDtAQAAmwQAIPMBAADbAQAgBQkAALYDACCrAQEAAAABywECAAAAAcwBCAAAAAHNAQEAAAABAgAAAAsAIBwAALUDACADAAAACwAgHAAAtQMAIB0AALMDACABFQAAmQQAMAIAAAALACAVAACzAwAgAgAAAIsDACAVAACyAwAgBKsBAQDBAgAhywECAO8CACHMAQgA_gIAIc0BAQDBAgAhBQkAALQDACCrAQEAwQIAIcsBAgDvAgAhzAEIAP4CACHNAQEAwQIAIQUcAACUBAAgHQAAlwQAIO0BAACVBAAg7gEAAJYEACDzAQAAFwAgBQkAALYDACCrAQEAAAABywECAAAAAcwBCAAAAAHNAQEAAAABAxwAAJQEACDtAQAAlQQAIPMBAAAXACAOBQAAuAMAIAgAALkDACALAAC6AwAgqwEBAAAAAawBAQAAAAG3AUAAAAABuAFAAAAAAcwBCAAAAAHUAQEAAAAB1QECAAAAAdYBAQAAAAHXAQEAAAAB2AEgAAAAAdkBAQAAAAEDHAAAkgQAIO0BAACTBAAg8wEAAGoAIAQcAACsAwAw7QEAAK0DADDvAQAArwMAIPMBAACHAwAwBBwAAKEDADDtAQAAogMAMO8BAACkAwAg8wEAAOkCADAEHAAAkwMAMO0BAACUAwAw7wEAAJYDACDzAQAAlwMAMAQcAAD0AgAw7QEAAPUCADDvAQAA9wIAIPMBAAD4AgAwBBwAAOUCADDtAQAA5gIAMO8BAADoAgAg8wEAAOkCADAEHAAA2QIAMO0BAADaAgAw7wEAANwCACDzAQAA3QIAMAQcAADMAgAw7QEAAM0CADDvAQAAzwIAIPMBAADQAgAwAAAAAAAAAAAAAAAAAAAAAAAAAAAFHAAAjQQAIB0AAJAEACDtAQAAjgQAIO4BAACPBAAg8wEAANsBACADHAAAjQQAIO0BAACOBAAg8wEAANsBACAAAAAAAAUcAACIBAAgHQAAiwQAIO0BAACJBAAg7gEAAIoEACDzAQAA2wEAIAMcAACIBAAg7QEAAIkEACDzAQAA2wEAIAAAAAscAADhAwAwHQAA5QMAMO0BAADiAwAw7gEAAOMDADDvAQAA5AMAIPABAACXAwAw8QEAAJcDADDyAQAAlwMAMPMBAACXAwAw9AEAAOYDADD1AQAAmgMAMA4GAADcAwAgCAAAuQMAIAsAALoDACCrAQEAAAABrAEBAAAAAbcBQAAAAAG4AUAAAAABzAEIAAAAAdQBAQAAAAHVAQIAAAAB1gEBAAAAAdcBAQAAAAHYASAAAAAB2gEBAAAAAQIAAAAFACAcAADpAwAgAwAAAAUAIBwAAOkDACAdAADoAwAgARUAAIcEADACAAAABQAgFQAA6AMAIAIAAACbAwAgFQAA5wMAIAurAQEAwQIAIawBAQDBAgAhtwFAAMYCACG4AUAAxgIAIcwBCAD-AgAh1AEBAMECACHVAQIA7wIAIdYBAQDBAgAh1wEBAMMCACHYASAAwgIAIdoBAQDBAgAhDgYAANsDACAIAACfAwAgCwAAoAMAIKsBAQDBAgAhrAEBAMECACG3AUAAxgIAIbgBQADGAgAhzAEIAP4CACHUAQEAwQIAIdUBAgDvAgAh1gEBAMECACHXAQEAwwIAIdgBIADCAgAh2gEBAMECACEOBgAA3AMAIAgAALkDACALAAC6AwAgqwEBAAAAAawBAQAAAAG3AUAAAAABuAFAAAAAAcwBCAAAAAHUAQEAAAAB1QECAAAAAdYBAQAAAAHXAQEAAAAB2AEgAAAAAdoBAQAAAAEEHAAA4QMAMO0BAADiAwAw7wEAAOQDACDzAQAAlwMAMAAAAAAAAAUcAACCBAAgHQAAhQQAIO0BAACDBAAg7gEAAIQEACDzAQAA2wEAIAMcAACCBAAg7QEAAIMEACDzAQAA2wEAIAAAAAUcAAD9AwAgHQAAgAQAIO0BAAD-AwAg7gEAAP8DACDzAQAA2wEAIAMcAAD9AwAg7QEAAP4DACDzAQAA2wEAIAkDAADAAwAgCwAAwgMAIAwAAMEDACANAADDAwAgDwAAxAMAIK8BAAC9AgAgsAEAAL0CACC1AQAAvQIAILYBAAC9AgAgAAUFAAD8AwAgBgAA-AMAIAgAAPkDACALAADCAwAg1wEAAL0CACACBwAA-AMAIAgAAPkDACACAwAAwAMAINYBAAC9AgAgEAMAALsDACALAAC9AwAgDAAAvAMAIA8AAL8DACCrAQEAAAABrAEBAAAAAa0BAQAAAAGuASAAAAABrwEBAAAAAbABAQAAAAGyAQAAALIBArQBAAAAtAECtQEBAAAAAbYBAQAAAAG3AUAAAAABuAFAAAAAAQIAAADbAQAgHAAA_QMAIAMAAADeAQAgHAAA_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_wLQASK3AUAAxgIAIbgBQADGAgAhyQEBAMECACHOAQgA_gIAIdEBAACAA9EBItIBAQDBAgAh0wEBAMECACEKBwAA1AMAIKsBAQDBAgAhtAEAAP8C0AEitwFAAMYCACG4AUAAxgIAIckBAQDBAgAhzgEIAP4CACHRAQAAgAPRASLSAQEAwQIAIdMBAQDBAgAhBKsBAQAAAAHLAQIAAAABzAEIAAAAAc0BAQAAAAEQAwAAuwMAIAwAALwDACANAAC-AwAgDwAAvwMAIKsBAQAAAAGsAQEAAAABrQEBAAAAAa4BIAAAAAGvAQEAAAABsAEBAAAAAbIBAAAAsgECtAEAAAC0AQK1AQEAAAABtgEBAAAAAbcBQAAAAAG4AUAAAAABAgAAANsBACAcAACaBAAgAwAAAN4BACAcAACaBAAgHQAAngQAIBIAAADeAQAgAwAAxwIAIAwAAMgCACANAADKAgAgDwAAywIAIBUAAJ4EACCrAQEAwQIAIawBAQDBAgAhrQEBAMECACGuASAAwgIAIa8BAQDDAgAhsAEBAMMCACGyAQAAxAKyASK0AQAAxQK0ASK1AQEAwwIAIbYBAQDDAgAhtwFAAMYCACG4AUAAxgIAIRADAADHAgAgDAAAyAIAIA0AAMoCACAPAADLAgAgqwEBAMECACGsAQEAwQIAIa0BAQDBAgAhrgEgAMICACGvAQEAwwIAIbABAQDDAgAhsgEAAMQCsgEitAEAAMUCtAEitQEBAMMCACG2AQEAwwIAIbcBQADGAgAhuAFAAMYCACEGqwEBAAAAAbcBQAAAAAG4AUAAAAABxwECAAAAAcgBAQAAAAHJAQEAAAABAwAAAG0AIBwAAJIEACAdAACiBAAgCAAAAG0AIBUAAKIEACCrAQEAwQIAIawBAQDBAgAhtwFAAMYCACG4AUAAxgIAIdYBAQDDAgAh2wEBAMECACEGqwEBAMECACGsAQEAwQIAIbcBQADGAgAhuAFAAMYCACHWAQEAwwIAIdsBAQDBAgAhC6sBAQAAAAGsAQEAAAABtwFAAAAAAbgBQAAAAAHMAQgAAAAB1AEBAAAAAdUBAgAAAAHWAQEAAAAB1wEBAAAAAdgBIAAAAAHZAQEAAAABDwUAALgDACAGAADcAwAgCwAAugMAIKsBAQAAAAGsAQEAAAABtwFAAAAAAbgBQAAAAAHMAQgAAAAB1AEBAAAAAdUBAgAAAAHWAQEAAAAB1wEBAAAAAdgBIAAAAAHZAQEAAAAB2gEBAAAAAQIAAAAFACAcAACkBAAgAwAAAAMAIBwAAKQEACAdAACoBAAgEQAAAAMAIAUAAJ4DACAGAADbAwAgCwAAoAMAIBUAAKgEACCrAQEAwQIAIawBAQDBAgAhtwFAAMYCACG4AUAAxgIAIcwBCAD-AgAh1AEBAMECACHVAQIA7wIAIdYBAQDBAgAh1wEBAMMCACHYASAAwgIAIdkBAQDBAgAh2gEBAMECACEPBQAAngMAIAYAANsDACALAACgAwAgqwEBAMECACGsAQEAwQIAIbcBQADGAgAhuAFAAMYCACHMAQgA_gIAIdQBAQDBAgAh1QECAO8CACHWAQEAwQIAIdcBAQDDAgAh2AEgAMICACHZAQEAwQIAIdoBAQDBAgAhBKsBAQAAAAHKAQEAAAABywECAAAAAcwBCAAAAAEIqwEBAAAAAbQBAAAA0AECtwFAAAAAAbgBQAAAAAHOAQgAAAAB0QEAAADRAQLSAQEAAAAB0wEBAAAAAQ8FAAC4AwAgBgAA3AMAIAgAALkDACCrAQEAAAABrAEBAAAAAbcBQAAAAAG4AUAAAAABzAEIAAAAAdQBAQAAAAHVAQIAAAAB1gEBAAAAAdcBAQAAAAHYASAAAAAB2QEBAAAAAdoBAQAAAAECAAAABQAgHAAAqwQAIAMAAAADACAcAACrBAAgHQAArwQAIBEAAAADACAFAACeAwAgBgAA2wMAIAgAAJ8DACAVAACvBAAgqwEBAMECACGsAQEAwQIAIbcBQADGAgAhuAFAAMYCACHMAQgA_gIAIdQBAQDBAgAh1QECAO8CACHWAQEAwQIAIdcBAQDDAgAh2AEgAMICACHZAQEAwQIAIdoBAQDBAgAhDwUAAJ4DACAGAADbAwAgCAAAnwMAIKsBAQDBAgAhrAEBAMECACG3AUAAxgIAIbgBQADGAgAhzAEIAP4CACHUAQEAwQIAIdUBAgDvAgAh1gEBAMECACHXAQEAwwIAIdgBIADCAgAh2QEBAMECACHaAQEAwQIAIQarAQEAAAABtwFAAAAAAbgBQAAAAAHHAQIAAAAByAEBAAAAAcoBAQAAAAEHqwEBAAAAAbcBQAAAAAG4AUAAAAAB3gFAAAAAAegBAQAAAAHpAQEAAAAB6gEBAAAAAQyrAQEAAAABsAEBAAAAAbcBQAAAAAG4AUAAAAAB3wEBAAAAAeABAQAAAAHiAQEAAAAB4wEBAAAAAeQBAQAAAAHlAUAAAAAB5gFAAAAAAecBAQAAAAEBDgACBgMGAwQADAsZCQwYBw0cAQ8gCwUEAAoFAAQGAAIIDAYLEgkCAwcDBAAFAQMIAAIJAAcKAAMDBAAIBwACCA0GAQgOAAIHAAIKAAMCCBMACxQAAQ4AAgUDIQALIwAMIgANJAAPJQAAAQ4AAgEOAAIDBAARIgASIwATAAAAAwQAESIAEiMAEwEOAAIBDgACAwQAGCIAGSMAGgAAAAMEABgiABkjABoAAAADBAAgIgAhIwAiAAAAAwQAICIAISMAIgAAAwQAJyIAKCMAKQAAAAMEACciACgjACkCBQAEBgACAgUABAYAAgUEAC4iADEjADJkAC9lADAAAAAAAAUEAC4iADEjADJkAC9lADABBwACAQcAAgUEADciADojADtkADhlADkAAAAAAAUEADciADojADtkADhlADkCCQAHCgADAgkABwoAAwUEAEAiAEMjAERkAEFlAEIAAAAAAAUEAEAiAEMjAERkAEFlAEICBwACCgADAgcAAgoAAwUEAEkiAEwjAE1kAEplAEsAAAAAAAUEAEkiAEwjAE1kAEplAEsAAAMEAFIiAFMjAFQAAAADBABSIgBTIwBUEAIBESYBEicBEygBFCkBFisBFy0NGC4OGTABGjINGzMPHjQBHzUBIDYNJDkQJToUJjsLJzwLKD0LKT4LKj8LK0ELLEMNLUQVLkYLL0gNMEkWMUoLMksLM0wNNE8XNVAbNlIcN1McOFYcOVccOlgcO1ocPFwNPV0dPl8cP2ENQGIeQWMcQmQcQ2UNRGgfRWkjRmsER2wESG8ESXAESnEES3METHUNTXYkTngET3oNUHslUXwEUn0EU34NVIEBJlWCASpWgwEDV4QBA1iFAQNZhgEDWocBA1uJAQNciwENXYwBK16OAQNfkAENYJEBLGGSAQNikwEDY5QBDWaXAS1nmAEzaJkBB2maAQdqmwEHa5wBB2ydAQdtnwEHbqEBDW-iATRwpAEHcaYBDXKnATVzqAEHdKkBB3WqAQ12rQE2d64BPHivAQZ5sAEGerEBBnuyAQZ8swEGfbUBBn63AQ1_uAE9gAG6AQaBAbwBDYIBvQE-gwG-AQaEAb8BBoUBwAENhgHDAT-HAcQBRYgBxQEJiQHGAQmKAccBCYsByAEJjAHJAQmNAcsBCY4BzQENjwHOAUaQAdABCZEB0gENkgHTAUeTAdQBCZQB1QEJlQHWAQ2WAdkBSJcB2gFOmAHcAQKZAd0BApoB4AECmwHhAQKcAeIBAp0B5AECngHmAQ2fAecBT6AB6QECoQHrAQ2iAewBUKMB7QECpAHuAQKlAe8BDaYB8gFRpwHzAVU"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AccountScalarFieldEnum: () => AccountScalarFieldEnum,
  AnyNull: () => AnyNull2,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  JsonNull: () => JsonNull2,
  MedicineScalarFieldEnum: () => MedicineScalarFieldEnum,
  ModelName: () => ModelName,
  NullTypes: () => NullTypes2,
  NullsOrder: () => NullsOrder,
  OrderItemScalarFieldEnum: () => OrderItemScalarFieldEnum,
  OrderScalarFieldEnum: () => OrderScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  QueryMode: () => QueryMode,
  ReviewScalarFieldEnum: () => ReviewScalarFieldEnum,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VerificationScalarFieldEnum: () => VerificationScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.10.0",
  engine: "0edf323efd1d98336f3f0a68684b56f689b900d3"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  Session: "Session",
  Account: "Account",
  Verification: "Verification",
  Category: "Category",
  Medicine: "Medicine",
  Order: "Order",
  OrderItem: "OrderItem",
  Review: "Review",
  User: "User"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var SessionScalarFieldEnum = {
  id: "id",
  expiresAt: "expiresAt",
  token: "token",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  userId: "userId"
};
var AccountScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  providerId: "providerId",
  userId: "userId",
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  idToken: "idToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  scope: "scope",
  password: "password",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var VerificationScalarFieldEnum = {
  id: "id",
  identifier: "identifier",
  value: "value",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var CategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug",
  description: "description",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var MedicineScalarFieldEnum = {
  id: "id",
  name: "name",
  manufacturer: "manufacturer",
  price: "price",
  stock: "stock",
  description: "description",
  imageUrl: "imageUrl",
  isOTC: "isOTC",
  categoryId: "categoryId",
  sellerId: "sellerId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var OrderScalarFieldEnum = {
  id: "id",
  totalAmount: "totalAmount",
  status: "status",
  paymentStatus: "paymentStatus",
  shippingAddress: "shippingAddress",
  contactPhone: "contactPhone",
  customerId: "customerId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var OrderItemScalarFieldEnum = {
  id: "id",
  quantity: "quantity",
  price: "price",
  orderId: "orderId",
  medicineId: "medicineId"
};
var ReviewScalarFieldEnum = {
  id: "id",
  rating: "rating",
  comment: "comment",
  customerId: "customerId",
  medicineId: "medicineId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  emailVerified: "emailVerified",
  image: "image",
  password: "password",
  role: "role",
  status: "status",
  phone: "phone",
  address: "address",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
var connectionString = env2.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
import { APIError } from "better-auth/api";
var auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId }
          });
          if (user?.status === UserStatus.BLOCKED || user?.status === UserStatus.SUSPENDED) {
            throw new APIError("FORBIDDEN", {
              message: `Your account has been ${user.status.toLowerCase()} by the admin.`
            });
          }
        }
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: UserRole.CUSTOMER,
        input: false
      }
    }
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production"
    // crossSubDomainCookies: { enabled: true },
  }
});

// src/errors/globalErrorHandler.ts
import { ZodError as ZodError2 } from "zod";

// src/errors/ApiError.ts
var ApiError = class extends Error {
  statusCode;
  isOperational;
  constructor(statusCode, message, isOperational = true, stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var ApiError_default = ApiError;

// src/errors/handlePrismaError.ts
var handlePrismaError = (err) => {
  let errorSources = [];
  let statusCode = 400;
  let message = "Database Error";
  switch (err.code) {
    // Value too long for the column
    case "P2000":
      message = "The provided value for the column is too long";
      errorSources = [
        {
          path: err.meta?.column_name || "",
          message
        }
      ];
      break;
    // Record searched for in the where condition does not exist
    case "P2001":
      statusCode = 404;
      message = "Record does not exist";
      errorSources = [
        {
          path: "",
          message: "Record not found in the database"
        }
      ];
      break;
    // Unique constraint failed
    case "P2002": {
      const target = err.meta?.target || [];
      message = `Duplicate entry for ${target.join(", ")}`;
      errorSources = target.map((field) => ({
        path: field,
        message: `${field} already exists`
      }));
      break;
    }
    // Foreign key constraint failed
    case "P2003":
      message = "Foreign key constraint failed";
      errorSources = [
        {
          path: err.meta?.field_name || "",
          message: "Referenced record does not exist"
        }
      ];
      break;
    // The change you are trying to make would violate the required relation
    case "P2014":
      message = "Relation violation";
      errorSources = [
        {
          path: "",
          message: "The change would violate a required relation between models"
        }
      ];
      break;
    // Record not found (usually on update/delete)
    case "P2025":
      statusCode = 404;
      message = err.meta?.cause || "Record not found";
      errorSources = [
        {
          path: "",
          message
        }
      ];
      break;
    // Fallback for any other known Prisma errors
    default:
      message = "Something went wrong in the database";
      errorSources = [
        {
          path: "",
          message: err.message
        }
      ];
      break;
  }
  return {
    statusCode,
    message,
    errorSources
  };
};

// src/errors/handleZodError.ts
import "zod";
var handleZodError = (err) => {
  const errorSources = err.issues.map((issue) => {
    const lastPath = issue.path[issue.path.length - 1];
    return {
      path: typeof lastPath === "string" || typeof lastPath === "number" ? lastPath : "",
      message: issue.message
    };
  });
  const statusCode = 400;
  return {
    statusCode,
    message: "Validation Error",
    errorSources
  };
};
var handleZodError_default = handleZodError;

// src/errors/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorSources = [
    {
      path: "",
      message: "Something went wrong!"
    }
  ];
  if (err instanceof ZodError2) {
    const simplifiedError = handleZodError_default(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    const simplifiedError = handlePrismaError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof ApiError_default) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [
      {
        path: "",
        message: err.message
      }
    ];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [
      {
        path: "",
        message: err.message
      }
    ];
  }
  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    ...env.NODE_ENV === "development" && { stack: err?.stack }
  });
};

// src/middlewares/notFound.ts
var notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
};
var notFound_default = notFound;

// src/routes/index.ts
import { Router } from "express";
var entryRoutes = Router();
entryRoutes.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "MediStore API is running"
  });
});
var routes_default = entryRoutes;

// src/app.ts
var app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: trustedOrigins,
    credentials: true
  })
);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api", routes_default);
app.use(notFound_default);
app.use(globalErrorHandler);
var app_default = app;

// src/server.ts
var server;
async function bootstrap() {
  try {
    server = app_default.listen(env.PORT, () => {
      console.log(`\u{1F680} Server listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception detected:", error);
  process.exit(1);
});
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection detected, shutting down server...");
  if (server) {
    server.close(() => {
      console.error(error);
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
bootstrap();
