import { readFileSync } from "node:fs";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { Quiz } from "@/generated/prisma/client";
import { QuizOrigin } from "@/generated/prisma/enums";
import {
  formatJapaneseFiscalYear,
  formatQuizSource,
  validatePastExamMeta,
} from "@/lib/past-exam";

describe("past-exam", () => {
  it("T-013 AC1 QuizOrigin は2値で Quiz 型に項目があり、既定は SIMILAR", () => {
    expect(Object.values(QuizOrigin).sort()).toEqual(["PAST_EXAM", "SIMILAR"]);
    expectTypeOf<Quiz["origin"]>().toEqualTypeOf<QuizOrigin>();
    expectTypeOf<Quiz["examYear"]>().toEqualTypeOf<number | null>();
    expectTypeOf<Quiz["examQuestionNumber"]>().toEqualTypeOf<number | null>();
    expectTypeOf<Quiz["examSubQuestionNumber"]>().toEqualTypeOf<number | null>();
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    expect(schema).toMatch(/origin\s+QuizOrigin\s+@default\(SIMILAR\)/);
  });

  it("T-013 AC2 formatJapaneseFiscalYear は令和・平成で書く", () => {
    expect(formatJapaneseFiscalYear(2023)).toBe("令和5年度");
    expect(formatJapaneseFiscalYear(2019)).toBe("令和元年度");
    expect(formatJapaneseFiscalYear(2018)).toBe("平成30年度");
    expect(formatJapaneseFiscalYear(2001)).toBe("平成13年度");
  });

  it("T-013 AC3 formatQuizSource は過去問・類題を書式化し、不足なら null", () => {
    expect(
      formatQuizSource({ origin: "PAST_EXAM", examYear: 2023, examQuestionNumber: 10, examSubQuestionNumber: 1 }),
    ).toBe("令和5年度 第10問 設問1（過去問）");
    expect(formatQuizSource({ origin: "PAST_EXAM", examYear: 2023, examQuestionNumber: 10 })).toBe(
      "令和5年度 第10問（過去問）",
    );
    expect(formatQuizSource({ origin: "SIMILAR", examYear: 2023, examQuestionNumber: 10 })).toBe(
      "類題（令和5年度 第10問）",
    );
    expect(formatQuizSource({ origin: "SIMILAR", examYear: 2023 })).toBeNull();
    expect(formatQuizSource({ origin: "SIMILAR", examQuestionNumber: 10 })).toBeNull();
    expect(formatQuizSource({ origin: "SIMILAR" })).toBeNull();
  });

  it("T-013 AC4 validatePastExamMeta は不正をエラーにし、正しい入力は空配列", () => {
    expect(validatePastExamMeta({ origin: "PAST_EXAM", examQuestionNumber: 1 })).not.toEqual([]);
    expect(validatePastExamMeta({ origin: "PAST_EXAM", examYear: 2023 })).not.toEqual([]);
    for (const y of [2000, 2101, 2023.5]) {
      expect(validatePastExamMeta({ origin: "PAST_EXAM", examYear: y, examQuestionNumber: 1 })).not.toEqual([]);
    }
    for (const n of [0, -1, 1.5]) {
      expect(validatePastExamMeta({ origin: "PAST_EXAM", examYear: 2023, examQuestionNumber: n })).not.toEqual([]);
      expect(
        validatePastExamMeta({ origin: "PAST_EXAM", examYear: 2023, examQuestionNumber: 1, examSubQuestionNumber: n }),
      ).not.toEqual([]);
    }
    expect(
      validatePastExamMeta({ origin: "PAST_EXAM", examYear: 2023, examQuestionNumber: 10, examSubQuestionNumber: 2 }),
    ).toEqual([]);
    expect(validatePastExamMeta({ origin: "SIMILAR" })).toEqual([]);
  });
});
