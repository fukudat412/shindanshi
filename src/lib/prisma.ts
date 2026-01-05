import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

// 本番環境でもキャッシュして、コールドスタート時の再初期化を防ぐ
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;
