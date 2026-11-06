// Prisma CLI の設定（Prisma 7 からは .env を自動で読まないので dotenv で読み込む。既に設定済みの環境変数は上書きしない）
import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // env("DATABASE_URL") だと未設定のとき generate まで失敗する（CI は DB なしで generate する）ので process.env から読む
    url: process.env.DATABASE_URL,
  },
})
