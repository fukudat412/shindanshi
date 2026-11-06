import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // pg の既定は接続待ちが無制限なので、Prisma 6 までと同じく 5 秒で諦める
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5_000 }),
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

// 本番環境でもキャッシュして、コールドスタート時の再初期化を防ぐ
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;
