import type { UserRole, UserStatus } from "@/generated/prisma/enums";
import type { Session } from "better-auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        status: UserStatus;
      };
      session?: Session;
    }
  }
}

export {};