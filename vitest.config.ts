import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    // tsconfig.json の paths（@/*）を Vite 自体に解決させる
    tsconfigPaths: true,
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
})
