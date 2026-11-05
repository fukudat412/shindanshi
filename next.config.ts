import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev が AGENTS.md を自動生成しないようにする（hootl のレビュー役が読む指示を Next.js の更新で変えないため）
  agentRules: false,
};

export default nextConfig;
