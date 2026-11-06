import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { queueReasonLabel } from "@/lib/today-queue";
import { TodayQueueSummary } from "@/app/today/queue-summary";

const read = (p: string) => readFileSync(p, "utf8");

describe("today", () => {
  it("T-009 AC1 queueReasonLabel", () => {
    expect(queueReasonLabel("due")).toBe("期限切れ");
    expect(queueReasonLabel("weak")).toBe("弱点論点");
    expect(queueReasonLabel("new")).toBe("未出題");
  });

  it("T-009 AC2 件数を描画する", () => {
    const html = renderToStaticMarkup(
      createElement(TodayQueueSummary, { counts: { due: 2, weak: 1, new: 3 } }),
    );
    expect(html).toContain("期限切れ 2件");
    expect(html).toContain("弱点論点 1件");
    expect(html).toContain("未出題 3件");
  });

  it("T-009 AC3 空のとき", () => {
    const html = renderToStaticMarkup(
      createElement(TodayQueueSummary, { counts: { due: 0, weak: 0, new: 0 } }),
    );
    expect(html).toContain("今日の問題はありません");
  });

  it("T-009 AC4 page のソース", () => {
    const src = read("src/app/today/page.tsx");
    expect(src).toContain("getCurrentUserId");
    expect(src).toContain("buildTodayQueue");
    expect(src).toContain("shuffleChoicesForDisplay");
    expect(src).toMatch(/label:\s*queueReasonLabel\(/);
    expect(src).toContain("<QuizClient");
  });

  it("T-009 AC5 articleId は任意で quiz ページは渡す", () => {
    expect(read("src/app/quiz/quiz-client.tsx")).toContain("articleId?: string");
    expect(read("src/app/quiz/page.tsx")).toContain("articleId={article.id}");
  });

  it("T-009 AC6 /today へのリンク", () => {
    expect(read("src/app/layout.tsx")).toContain('href="/today"');
    expect(read("src/components/mobile-nav.tsx")).toContain('href: "/today"');
    expect(read("src/app/page.tsx")).toContain('href="/today"');
  });
});
