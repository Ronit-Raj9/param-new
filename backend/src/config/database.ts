import { PrismaClient } from "@prisma/client";
import { env, isDev } from "./env.js";

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ["query", "error", "warn"] : ["error"],
  });

if (isDev) {
  globalForPrisma.prisma = prisma;
}

// Connection test
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log("📴 Database disconnected");
}
