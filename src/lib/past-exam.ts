import type { QuizOrigin } from "@/generated/prisma/enums";

export type PastExamMeta = {
  origin: QuizOrigin;
  examYear?: number | null;
  examQuestionNumber?: number | null;
  examSubQuestionNumber?: number | null;
};

/** 西暦を和暦の年度表記にする（2019 以降は令和、以前は平成） */
export function formatJapaneseFiscalYear(year: number): string {
  if (year >= 2019) {
    const n = year - 2018;
    return `令和${n === 1 ? "元" : n}年度`;
  }
  return `平成${year - 1988}年度`;
}

/** 出典の表示文字列。表示できる情報がなければ null */
export function formatQuizSource(meta: PastExamMeta): string | null {
  const { origin, examYear, examQuestionNumber, examSubQuestionNumber } = meta;
  if (examYear == null || examQuestionNumber == null) {
    return null;
  }
  const base = `${formatJapaneseFiscalYear(examYear)} 第${examQuestionNumber}問`;
  if (origin === "PAST_EXAM") {
    const sub = examSubQuestionNumber == null ? "" : ` 設問${examSubQuestionNumber}`;
    return `${base}${sub}（過去問）`;
  }
  return `類題（${base}）`;
}

const isPositiveInt = (n: number) => Number.isInteger(n) && n >= 1;

/** 過去問メタ情報の検証。エラーメッセージの配列を返す（空なら正常） */
export function validatePastExamMeta(meta: PastExamMeta): string[] {
  const errors: string[] = [];
  const { origin, examYear, examQuestionNumber, examSubQuestionNumber } = meta;
  if (origin === "PAST_EXAM") {
    if (examYear == null) errors.push("過去問には年度が必要です");
    if (examQuestionNumber == null) errors.push("過去問には問番号が必要です");
  }
  if (examYear != null && !(Number.isInteger(examYear) && examYear >= 2001 && examYear <= 2100)) {
    errors.push("年度は2001〜2100の整数で指定してください");
  }
  if (examQuestionNumber != null && !isPositiveInt(examQuestionNumber)) {
    errors.push("問番号は1以上の整数で指定してください");
  }
  if (examSubQuestionNumber != null && !isPositiveInt(examSubQuestionNumber)) {
    errors.push("設問番号は1以上の整数で指定してください");
  }
  return errors;
}
