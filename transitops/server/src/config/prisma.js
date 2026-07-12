import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma =
    globalThis.prismaClient ||
    new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["error", "warn"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalThis.prismaClient = prisma;
}

export default prisma;