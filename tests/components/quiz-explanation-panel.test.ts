import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuizExplanationPanel } from "@/components/quiz-explanation-panel";

const base = { explanation: null, choiceFeedback: [], basis: null, basisYear: null };
const render = (props: Partial<Parameters<typeof QuizExplanationPanel>[0]>) =>
  renderToStaticMarkup(createElement(QuizExplanationPanel, { ...base, ...props }));

describe("QuizExplanationPanel", () => {
  it("T-012 AC1 選択肢を表示順に正誤と理由つきで描画する", () => {
    const html = render({
      choiceFeedback: [
        { text: "選択肢C", isCorrect: false, explanation: "理由C" },
        { text: "選択肢A", isCorrect: true, explanation: "理由A" },
      ],
    });
    expect(html.indexOf("選択肢C")).toBeLessThan(html.indexOf("選択肢A"));
    expect(html.indexOf("誤り")).toBeLessThan(html.indexOf("理由C"));
    expect(html.indexOf("理由C")).toBeLessThan(html.indexOf("正しい"));
    expect(html.indexOf("正しい")).toBeLessThan(html.indexOf("理由A"));
  });

  it("T-012 AC2 理由が null の選択肢は正誤だけで空の理由欄を出さない", () => {
    const html = render({
      choiceFeedback: [{ text: "選択肢A", isCorrect: true, explanation: null }],
    });
    expect(html).toContain("正しい");
    expect(html).not.toContain("<p");
  });

  it("T-012 AC3 根拠と基準年度を描画し、null の項目は見出しごと出さない", () => {
    const html = render({ basis: "中小企業白書", basisYear: 2024 });
    expect(html).toContain("根拠");
    expect(html).toContain("中小企業白書");
    expect(html).toContain("基準年度: 2024年度");
    const none = render({ explanation: "本文" });
    expect(none).not.toContain("根拠");
    expect(none).not.toContain("基準年度");
  });

  it("T-012 AC4 すべて空なら空文字列を描画する", () => {
    expect(render({})).toBe("");
  });

  it("T-012 AC5 クライアントはパネルを使い、各 page は buildChoiceFeedback を渡す", () => {
    for (const f of ["src/app/quiz/quiz-client.tsx", "src/app/practice/practice-client.tsx"]) {
      expect(readFileSync(f, "utf8")).toContain("<QuizExplanationPanel");
    }
    for (const f of ["src/app/quiz/page.tsx", "src/app/practice/page.tsx", "src/app/today/page.tsx"]) {
      expect(readFileSync(f, "utf8")).toMatch(/choiceFeedback: buildChoiceFeedback\(/);
    }
  });
});
