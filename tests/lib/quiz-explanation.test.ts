import { describe, expect, expectTypeOf, it } from "vitest";
import type { Quiz } from "@/generated/prisma/client";
import { buildChoiceFeedback, compactChoices, validateExplanationFields } from "@/lib/quiz-explanation";

const quiz = {
  quizType: "MULTIPLE_CHOICE" as const,
  answer: "B",
  choices: ["A", "B", "C"],
  choiceExplanations: ["aの理由", "bの理由", "cの理由"],
};

describe("quiz-explanation", () => {
  it("T-010 AC1 Quiz 型に解説・根拠・基準年度がある", () => {
    expectTypeOf<Quiz["choiceExplanations"]>().toEqualTypeOf<string[]>();
    expectTypeOf<Quiz["basis"]>().toEqualTypeOf<string | null>();
    expectTypeOf<Quiz["basisYear"]>().toEqualTypeOf<number | null>();
  });

  it("T-010 AC2 表示順で返し、解説は文字列で対応付く", () => {
    const r = buildChoiceFeedback(quiz, ["C", "A", "B"]);
    expect(r.map((x) => x.text)).toEqual(["C", "A", "B"]);
    expect(r.map((x) => x.explanation)).toEqual(["cの理由", "aの理由", "bの理由"]);
  });

  it("T-010 AC3 isCorrect は answer と同じ選択肢だけ true", () => {
    const r = buildChoiceFeedback(quiz, ["C", "A", "B"]);
    expect(r.map((x) => x.isCorrect)).toEqual([false, false, true]);
  });

  it("T-010 AC4 解説が空配列または空文字なら null", () => {
    const empty = buildChoiceFeedback({ ...quiz, choiceExplanations: [] }, ["A", "B"]);
    expect(empty.map((x) => x.explanation)).toEqual([null, null]);
    const blank = buildChoiceFeedback({ ...quiz, choiceExplanations: ["", "x", ""] }, ["A", "B"]);
    expect(blank.map((x) => x.explanation)).toEqual([null, "x"]);
  });

  it("T-010 AC5 validateExplanationFields の検証", () => {
    const ok = { quizType: "MULTIPLE_CHOICE" as const, choices: ["A", "B"], choiceExplanations: ["a", "b"], basisYear: 2024 };
    expect(validateExplanationFields(ok)).toEqual([]);
    expect(validateExplanationFields({ ...ok, choiceExplanations: [], basisYear: null })).toEqual([]);
    expect(validateExplanationFields({ ...ok, choiceExplanations: ["a"] })).toHaveLength(1);
    expect(validateExplanationFields({ ...ok, choices: ["A", "A"] })).toHaveLength(1);
    expect(validateExplanationFields({ ...ok, quizType: "TRUE_FALSE", choices: ["A", "A"] })).toEqual([]);
    expect(validateExplanationFields({ ...ok, basisYear: 1899 })).toHaveLength(1);
    expect(validateExplanationFields({ ...ok, basisYear: 2101 })).toHaveLength(1);
    expect(validateExplanationFields({ ...ok, basisYear: 2024.5 })).toHaveLength(1);
  });
});

describe("compactChoices", () => {
  it("T-011 AC1 空白のみの選択肢を解説ごと取り除き、対応を保つ", () => {
    expect(compactChoices(["A", "  ", "C", ""], ["a", "x", "c", "y"])).toEqual({
      choices: ["A", "C"],
      choiceExplanations: ["a", "c"],
    });
  });

  it("T-011 AC2 残った解説がすべて空なら空配列にする", () => {
    expect(compactChoices(["A", " ", "C"], ["", "x", ""])).toEqual({
      choices: ["A", "C"],
      choiceExplanations: [],
    });
  });
});
