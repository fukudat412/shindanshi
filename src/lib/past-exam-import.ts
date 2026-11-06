import type { QuizOrigin, QuizType } from "@/generated/prisma/enums";
import { validatePastExamMeta } from "@/lib/past-exam";
import { validateExplanationFields } from "@/lib/quiz-explanation";

export type PastExamImportItem = {
  articleId: string;
  topicId: string | null;
  origin: QuizOrigin;
  examYear: number;
  examQuestionNumber: number;
  examSubQuestionNumber: number | null;
  question: string;
  quizType: QuizType;
  answer: string;
  choices: string[];
  explanation: string | null;
  choiceExplanations: string[];
  basis: string | null;
  basisYear: number | null;
};

export type PastExamImportError = { index: number; message: string };

export type PastExamImportResult =
  | { ok: true; items: PastExamImportItem[] }
  | { ok: false; errors: PastExamImportError[] };

const QUIZ_TYPES: QuizType[] = [
  "TRUE_FALSE",
  "SHORT_TEXT",
  "NUMBER",
  "MULTIPLE_CHOICE",
];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim() !== "";

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

// 1要素を検証して item かエラーメッセージの配列を返す
function parseItem(raw: unknown): PastExamImportItem | string[] {
  if (!isRecord(raw)) return ["要素がオブジェクトではありません"];
  const errors: string[] = [];

  if (!isNonEmptyString(raw.articleId)) errors.push("articleId は文字列で指定してください");
  if (typeof raw.examYear !== "number") errors.push("examYear は数値で指定してください");
  if (typeof raw.examQuestionNumber !== "number") {
    errors.push("examQuestionNumber は数値で指定してください");
  }
  if (!isNonEmptyString(raw.question)) errors.push("question は文字列で指定してください");
  if (typeof raw.answer !== "string" || raw.answer === "") {
    errors.push("answer は文字列で指定してください");
  }
  const quizTypeOk =
    typeof raw.quizType === "string" && QUIZ_TYPES.includes(raw.quizType as QuizType);
  if (!quizTypeOk) {
    errors.push(`quizType は ${QUIZ_TYPES.join(" / ")} のいずれかで指定してください`);
  }

  // 任意項目の型
  const optString = (key: string): string | null => {
    const v = raw[key];
    if (v == null) return null;
    if (typeof v === "string") return v;
    errors.push(`${key} は文字列か null で指定してください`);
    return null;
  };
  const optNumber = (key: string): number | null => {
    const v = raw[key];
    if (v == null) return null;
    if (typeof v === "number") return v;
    errors.push(`${key} は数値か null で指定してください`);
    return null;
  };
  const optStringArray = (key: string): string[] => {
    const v = raw[key];
    if (v == null) return [];
    if (isStringArray(v)) return v;
    errors.push(`${key} は文字列の配列で指定してください`);
    return [];
  };

  const topicId = optString("topicId");
  const examSubQuestionNumber = optNumber("examSubQuestionNumber");
  const explanation = optString("explanation");
  const basis = optString("basis");
  const basisYear = optNumber("basisYear");
  const choices = optStringArray("choices");
  const choiceExplanations = optStringArray("choiceExplanations");

  if (errors.length > 0) return errors;

  const item: PastExamImportItem = {
    articleId: raw.articleId as string,
    topicId,
    origin: "PAST_EXAM",
    examYear: raw.examYear as number,
    examQuestionNumber: raw.examQuestionNumber as number,
    examSubQuestionNumber,
    question: raw.question as string,
    quizType: raw.quizType as QuizType,
    answer: raw.answer as string,
    choices,
    explanation,
    choiceExplanations,
    basis,
    basisYear,
  };

  // 出題形式ごとの検証
  if (item.quizType === "MULTIPLE_CHOICE") {
    if (choices.length < 2) {
      errors.push("MULTIPLE_CHOICE の choices は2つ以上必要です");
    } else if (!choices.includes(item.answer)) {
      errors.push("answer が choices の中にありません");
    }
  } else if (item.quizType === "TRUE_FALSE") {
    if (item.answer !== "true" && item.answer !== "false") {
      errors.push('TRUE_FALSE の answer は "true" か "false" で指定してください');
    }
  } else if (item.quizType === "NUMBER") {
    if (item.answer.trim() === "" || !Number.isFinite(Number(item.answer))) {
      errors.push("NUMBER の answer は数値として読める文字列で指定してください");
    }
  }

  errors.push(
    ...validatePastExamMeta({
      origin: item.origin,
      examYear: item.examYear,
      examQuestionNumber: item.examQuestionNumber,
      examSubQuestionNumber: item.examSubQuestionNumber,
    }),
    ...validateExplanationFields({
      quizType: item.quizType,
      choices: item.choices,
      choiceExplanations: item.choiceExplanations,
      basisYear: item.basisYear,
    }),
  );

  return errors.length > 0 ? errors : item;
}

/** 過去問の取り込み JSON を解析・検証する（DB には触れない）。1件でもエラーなら items は返さない */
export function parsePastExamImport(text: string): PastExamImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, errors: [{ index: -1, message: "JSON として読めません" }] };
  }
  if (!Array.isArray(data)) {
    return { ok: false, errors: [{ index: -1, message: "JSON の配列で指定してください" }] };
  }

  const items: PastExamImportItem[] = [];
  const errors: PastExamImportError[] = [];
  data.forEach((raw, index) => {
    const result = parseItem(raw);
    if (Array.isArray(result)) {
      for (const message of result) errors.push({ index, message });
    } else {
      items.push(result);
    }
  });
  return errors.length > 0 ? { ok: false, errors } : { ok: true, items };
}
