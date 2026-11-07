import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuizImages } from "@/components/quiz-images";
import { isExplanationUnverified } from "@/lib/quiz-explanation";

describe("QuizImages", () => {
  it("図を順に、画像の URL と大きさ付きで描画する", () => {
    const html = renderToStaticMarkup(
      createElement(QuizImages, {
        images: [
          { id: "img1", width: 800, height: 400 },
          { id: "img2", width: 300, height: 200 },
        ],
      }),
    );
    expect(html.indexOf("/api/quiz-images/img1")).toBeGreaterThan(-1);
    expect(html.indexOf("/api/quiz-images/img1")).toBeLessThan(html.indexOf("/api/quiz-images/img2"));
    expect(html).toContain('width="800"');
    expect(html).toContain('height="400"');
    expect(html).toContain('alt="問題の図 1/2"');
    expect(html).toContain('alt="問題の図 2/2"');
  });

  it("図がなければ何も描画しない", () => {
    expect(renderToStaticMarkup(createElement(QuizImages, { images: [] }))).toBe("");
  });

  it("出題・演習・模擬試験・年度別試験の画面が図を表示する", () => {
    for (const f of [
      "src/app/quiz/quiz-client.tsx",
      "src/app/practice/practice-client.tsx",
      "src/app/mock-exam/[id]/exam-client.tsx",
      "src/app/mock-exam/[id]/result/page.tsx",
      "src/app/exams/[id]/take/ExamTakeClient.tsx",
      "src/app/exams/[id]/result/page.tsx",
    ]) {
      expect(readFileSync(f, "utf8")).toContain("<QuizImages");
    }
  });
});

describe("isExplanationUnverified", () => {
  it("検証済み以外は未確認として扱う", () => {
    expect(isExplanationUnverified({ verificationStatus: "VERIFIED" })).toBe(false);
    for (const s of ["DRAFT", "NEEDS_FIX", "REJECTED"] as const) {
      expect(isExplanationUnverified({ verificationStatus: s })).toBe(true);
    }
  });
});
