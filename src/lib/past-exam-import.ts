import type { QuizOrigin, QuizType } from "@/generated/prisma/enums";
import { validatePastExamMeta } from "@/lib/past-exam";
import { validateExplanationFields } from "@/lib/quiz-explanation";
import { decodeBase64Png, type QuizImageData } from "@/lib/quiz-image";

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
  images: QuizImageData[];
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

export const MAX_IMAGES_PER_QUIZ = 10;

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

  // 図（base64 の PNG の配列）
  const images: QuizImageData[] = [];
  const rawImages = optStringArray("images");
  if (rawImages.length > MAX_IMAGES_PER_QUIZ) {
    errors.push(`images は ${MAX_IMAGES_PER_QUIZ} 枚までです`);
  } else {
    rawImages.forEach((text, i) => {
      const decoded = decodeBase64Png(text);
      if (typeof decoded === "string") errors.push(`images[${i}]: ${decoded}`);
      else images.push(decoded);
    });
  }

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
    images,
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

export type PastExamImportItemWithSubject = PastExamImportItem & { subjectId: string };

export type ExistingPastExam = {
  id: string;
  subjectId: string;
  examYear: number | null;
  examQuestionNumber: number | null;
  examSubQuestionNumber: number | null;
};

export type PastExamUpsertPlan = {
  creates: PastExamImportItemWithSubject[];
  updates: { id: string; item: PastExamImportItemWithSubject }[];
  duplicateIndexes: number[];
};

// 照合キー（科目・年度・問番号・設問番号。設問番号なしは null として扱う）
const upsertKey = (k: {
  subjectId: string;
  examYear: number | null;
  examQuestionNumber: number | null;
  examSubQuestionNumber: number | null;
}) => JSON.stringify([k.subjectId, k.examYear, k.examQuestionNumber, k.examSubQuestionNumber ?? null]);

/** 取り込み項目を、既存の問題の更新と新規作成に振り分ける。入力内で同じキーが重複する項目の index は duplicateIndexes に入れ、creates/updates からは除く */
export function planPastExamUpsert(
  items: PastExamImportItemWithSubject[],
  existing: ExistingPastExam[],
): PastExamUpsertPlan {
  const existingByKey = new Map<string, string>();
  for (const e of existing) existingByKey.set(upsertKey(e), e.id);

  const counts = new Map<string, number>();
  for (const item of items) {
    const key = upsertKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const creates: PastExamImportItemWithSubject[] = [];
  const updates: { id: string; item: PastExamImportItemWithSubject }[] = [];
  const duplicateIndexes: number[] = [];
  items.forEach((item, index) => {
    const key = upsertKey(item);
    if ((counts.get(key) ?? 0) > 1) {
      duplicateIndexes.push(index);
      return;
    }
    const id = existingByKey.get(key);
    if (id !== undefined) updates.push({ id, item });
    else creates.push(item);
  });
  return { creates, updates, duplicateIndexes };
}
