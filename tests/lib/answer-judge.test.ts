import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { judgeAnswer } from "@/lib/answer-judge";

const q = (quizType: "TRUE_FALSE" | "NUMBER" | "MULTIPLE_CHOICE" | "SHORT_TEXT", answer: string) => ({
  quizType,
  answer,
});

describe("judgeAnswer", () => {
  it("T-006 AC1 TRUE_FALSE は空白と大文字小文字を無視する", () => {
    expect(judgeAnswer(q("TRUE_FALSE", "true"), " TRUE ")).toBe(true);
    expect(judgeAnswer(q("TRUE_FALSE", "true"), "false")).toBe(false);
  });

  it("T-006 AC2 NUMBER は 0.0001 未満の誤差を許容し、非数値は不正解", () => {
    expect(judgeAnswer(q("NUMBER", "1"), "1.00001")).toBe(true);
    expect(judgeAnswer(q("NUMBER", "1"), "1.1")).toBe(false);
    expect(judgeAnswer(q("NUMBER", "1"), "abc")).toBe(false);
    expect(judgeAnswer(q("NUMBER", "abc"), "1")).toBe(false);
  });

  it("T-006 AC3 MULTIPLE_CHOICE は選択肢の値で判定し、位置やラベルは使わない", () => {
    const quiz = { ...q("MULTIPLE_CHOICE", "Beta"), choices: ["Alpha", "Beta", "Gamma"] };
    expect(judgeAnswer(quiz, " beta ")).toBe(true);
    expect(judgeAnswer(quiz, "Alpha")).toBe(false);
    expect(judgeAnswer(quiz, "1")).toBe(false);
    expect(judgeAnswer(quiz, "B")).toBe(false);
    // choices の並びを変えても結果は同じ
    const reordered = { ...quiz, choices: ["Gamma", "Beta", "Alpha"] };
    expect(judgeAnswer(reordered, "Beta")).toBe(true);
  });

  it("T-006 AC4 SHORT_TEXT は空白と大文字小文字を無視した完全一致", () => {
    expect(judgeAnswer(q("SHORT_TEXT", "Break Even"), "  break even ")).toBe(true);
    expect(judgeAnswer(q("SHORT_TEXT", "Break Even"), "break")).toBe(false);
  });

  it("T-006 AC5 未回答はどの種別でも不正解", () => {
    for (const t of ["TRUE_FALSE", "NUMBER", "MULTIPLE_CHOICE", "SHORT_TEXT"] as const) {
      for (const a of [null, "", "   "]) {
        expect(judgeAnswer(q(t, t === "NUMBER" ? "0" : ""), a)).toBe(false);
      }
    }
  });
});

describe("判定の呼び出し元", () => {
  const files = [
    "src/app/quiz/quiz-client.tsx",
    "src/app/practice/practice-client.tsx",
    "src/app/exams/[id]/actions.ts",
    "src/app/mock-exam/actions.ts",
  ];

  for (const file of files) {
    it(`T-006 AC6 ${file} は judgeAnswer を使い独自判定を持たない`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).toMatch(/import \{ judgeAnswer \} from "@\/lib\/answer-judge"/);
      expect(src).toMatch(/judgeAnswer\(/);
      expect(src).not.toMatch(/\.trim\(\)\.toLowerCase\(\)/);
      expect(src).not.toMatch(/compareNumbers/);
      expect(src).not.toMatch(/function checkAnswer|checkAnswer\(answer/);
      expect(src).not.toMatch(/parseFloat/);
    });
  }
});
