import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuizSourceBadge } from "@/components/quiz-source-badge";

const read = (p: string) => readFileSync(p, "utf8");

describe("QuizSourceBadge", () => {
  it("T-016 AC1 label を含む HTML を描画する", () => {
    const html = renderToStaticMarkup(
      createElement(QuizSourceBadge, { label: "令和5年度 第10問（過去問）" })
    );
    expect(html).toContain("令和5年度 第10問（過去問）");
  });

  it("T-016 AC2 label が null なら空文字列", () => {
    expect(renderToStaticMarkup(createElement(QuizSourceBadge, { label: null }))).toBe("");
  });

  it("T-016 AC3 page は sourceLabel を渡し client は QuizSourceBadge を使う", () => {
    for (const p of ["quiz", "practice", "today"]) {
      const s = read(`src/app/${p}/page.tsx`);
      expect(s).toContain("formatQuizSource");
      expect(s).toContain("sourceLabel: formatQuizSource(");
    }
    for (const p of ["quiz/quiz-client", "practice/practice-client"]) {
      expect(read(`src/app/${p}.tsx`)).toContain("<QuizSourceBadge");
    }
  });
});
