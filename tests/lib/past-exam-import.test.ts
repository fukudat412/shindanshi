import { describe, expect, it } from "vitest";
import { parsePastExamImport, planPastExamUpsert } from "@/lib/past-exam-import";

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
          images: [],
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

describe("parsePastExamImport の images", () => {
  // 幅 3・高さ 2 の PNG（IHDR まで。中身は読まないので、それ以降は省いてよい）
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
    0, 0, 0, 3, 0, 0, 0, 2, 8, 0, 0, 0, 0,
  ]).toString("base64");

  it("base64 の PNG を読み、大きさを付けて入力の順に返す", () => {
    const r = run([{ ...base, images: [png, png] }]);
    if (!r.ok) throw new Error(JSON.stringify(r.errors));
    expect(r.items[0].images).toHaveLength(2);
    expect(r.items[0].images[0]).toMatchObject({ width: 3, height: 2 });
    expect(r.items[0].images[0].data[0]).toBe(0x89);
  });

  it("PNG でない・base64 でない・配列でない images は、何番目かを付けて弾く", () => {
    const notPng = Buffer.from("hello world, this is not a png file").toString("base64");
    expect(errs([{ ...base, images: [png, notPng] }]).map((e) => e.message)).toEqual([
      "images[1]: PNG 画像ではないか、大きさが 10000px を超えています",
    ]);
    expect(errs([{ ...base, images: ["@@@"] }])[0].message).toBe(
      "images[0]: base64 の文字列ではありません",
    );
    expect(errs([{ ...base, images: "x" }])[0].message).toBe(
      "images は文字列の配列で指定してください",
    );
  });

  it("11 枚以上は弾く", () => {
    expect(errs([{ ...base, images: Array(11).fill(png) }])[0].message).toBe(
      "images は 10 枚までです",
    );
  });
});

describe("planPastExamUpsert", () => {
  const item = (o: Record<string, unknown> = {}) =>
    ({
      ...base,
      subjectId: "s1",
      topicId: null,
      origin: "PAST_EXAM",
      examSubQuestionNumber: null,
      images: [],
      choices: [],
      explanation: null,
      choiceExplanations: [],
      basis: null,
      basisYear: null,
      ...o,
    }) as Parameters<typeof planPastExamUpsert>[0][number];
  const ex = (o: Record<string, unknown> = {}) => ({
    id: "q1",
    subjectId: "s1",
    examYear: 2023,
    examQuestionNumber: 3,
    examSubQuestionNumber: null,
    ...o,
  });

  it("T-015 AC1 同じキーは updates（既存 id 付き）、なければ creates", () => {
    const p = planPastExamUpsert([item(), item({ examQuestionNumber: 4 })], [ex()]);
    expect(p.updates.map((u) => u.id)).toEqual(["q1"]);
    expect(p.creates).toHaveLength(1);
    expect(p.creates[0].examQuestionNumber).toBe(4);
    expect(p.duplicateIndexes).toEqual([]);
  });

  it("T-015 AC2 科目が違えば別の問題", () => {
    const p = planPastExamUpsert([item({ subjectId: "s2" })], [ex()]);
    expect(p.creates).toHaveLength(1);
    expect(p.updates).toHaveLength(0);
  });

  it("T-015 AC2 設問番号は null 同士が同じキー、null と 1 は別のキー", () => {
    expect(planPastExamUpsert([item()], [ex()]).updates).toHaveLength(1);
    expect(planPastExamUpsert([item({ examSubQuestionNumber: 1 })], [ex()]).creates).toHaveLength(1);
    expect(planPastExamUpsert([item()], [ex({ examSubQuestionNumber: 1 })]).creates).toHaveLength(1);
  });

  it("T-015 AC3 入力内で同じキーが複数あると index が duplicateIndexes に入る", () => {
    const p = planPastExamUpsert([item(), item({ examQuestionNumber: 9 }), item()], []);
    expect(p.duplicateIndexes).toEqual([0, 2]);
    expect(p.creates).toHaveLength(1);
  });
});
