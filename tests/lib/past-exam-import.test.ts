import { describe, expect, it } from "vitest";
import { parsePastExamImport } from "@/lib/past-exam-import";

const base = {
  articleId: "a1",
  examYear: 2023,
  examQuestionNumber: 3,
  question: "Q",
  quizType: "TRUE_FALSE",
  answer: "true",
};
const run = (arr: unknown[]) => parsePastExamImport(JSON.stringify(arr));
const errs = (arr: unknown[]) => {
  const r = run(arr);
  if (r.ok) throw new Error("expected failure");
  return r.errors;
};

describe("parsePastExamImport", () => {
  it("T-014 AC1 正しい配列は items を返し、省略項目を埋める", () => {
    const r = run([base]);
    expect(r).toEqual({
      ok: true,
      items: [
        {
          ...base,
          topicId: null,
          origin: "PAST_EXAM",
          examSubQuestionNumber: null,
          choices: [],
          explanation: null,
          choiceExplanations: [],
          basis: null,
          basisYear: null,
        },
      ],
    });
  });

  it("T-014 AC2 JSON として読めない／配列でない入力は index -1", () => {
    for (const text of ["{oops", '{"a":1}', "null"]) {
      const r = parsePastExamImport(text);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors).toHaveLength(1);
      if (!r.ok) expect(r.errors[0].index).toBe(-1);
    }
  });

  it("T-014 AC3 必須項目の欠落・型違いは index 付きエラー", () => {
    for (const key of ["articleId", "examYear", "examQuestionNumber", "question", "quizType", "answer"]) {
      const { [key]: _omit, ...rest } = base as Record<string, unknown>;
      void _omit;
      const e = errs([base, rest]);
      expect(e.length).toBeGreaterThan(0);
      expect(e.every((x) => x.index === 1)).toBe(true);
    }
    expect(errs([{ ...base, examYear: "2023" }])[0].index).toBe(0);
    expect(errs([{ ...base, quizType: "OTHER" }])[0].index).toBe(0);
    expect(errs([42])[0].index).toBe(0);
  });

  it("T-014 AC4 出題形式ごとの answer／choices 検証", () => {
    expect(errs([{ ...base, quizType: "MULTIPLE_CHOICE", answer: "a", choices: ["a"] }])).toHaveLength(1);
    expect(errs([{ ...base, quizType: "MULTIPLE_CHOICE", answer: "c", choices: ["a", "b"] }])).toHaveLength(1);
    expect(run([{ ...base, quizType: "MULTIPLE_CHOICE", answer: "a", choices: ["a", "b"] }]).ok).toBe(true);
    expect(errs([{ ...base, answer: "yes" }])).toHaveLength(1);
    expect(errs([{ ...base, quizType: "NUMBER", answer: "abc" }])).toHaveLength(1);
    expect(run([{ ...base, quizType: "NUMBER", answer: "12.5" }]).ok).toBe(true);
  });

  it("T-014 AC5 メタ情報・解説の検証エラーも index 付きで返る", () => {
    const meta = errs([base, { ...base, examYear: 1999 }]);
    expect(meta).toHaveLength(1);
    expect(meta[0].index).toBe(1);
    const expl = errs([{ ...base, choiceExplanations: ["x"], basisYear: 1800 }]);
    expect(expl.length).toBe(2);
    expect(expl.every((x) => x.index === 0)).toBe(true);
  });

  it("T-014 AC6 1件でもエラーなら items を返さず、全要素のエラーを返す", () => {
    const r = run([base, { ...base, answer: "x" }, { ...base, examYear: 1999 }]);
    expect(r.ok).toBe(false);
    expect("items" in r).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.index)).toEqual([1, 2]);
  });
});
