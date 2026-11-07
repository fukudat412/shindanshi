import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev が AGENTS.md を自動生成しないようにする（hootl のレビュー役が読む指示を Next.js の更新で変えないため）
  agentRules: false,
  experimental: {
    // 過去問の取り込み（/admin/import）で、図（base64 の PNG）を含む JSON を貼り付けられるようにする。
    // 1 年度・1 科目分は図を含めて 1〜2MB なので、余裕を見て 10MB（既定は 1MB）。全 Server Action に効くので大きくしすぎない
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
