import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev が AGENTS.md を自動生成しないようにする（hootl のレビュー役が読む指示を Next.js の更新で変えないため）
  agentRules: false,
  experimental: {
    // 過去問の取り込み（/admin/import）で、図（base64 の PNG）を含む JSON を貼り付けられるようにする
    serverActions: { bodySizeLimit: "50mb" },
  },
};

export default nextConfig;
