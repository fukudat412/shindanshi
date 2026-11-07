import type { QuizType, VerificationStatus } from "@/generated/prisma/enums";
import { judgeAnswer } from "@/lib/answer-judge";

export type ChoiceFeedback = {
  text: string;
  isCorrect: boolean;
  explanation: string | null;
};

// 表示順（シャッフル後）の選択肢ごとに、正誤と解説を返す。
// 解説は位置ではなく選択肢の文字列で元の choices と対応付ける。
export function buildChoiceFeedback(
  quiz: {
    quizType: QuizType;
    answer: string;
    choices: string[];
    choiceExplanations: string[];
  },
  displayedChoices: string[],
): ChoiceFeedback[] {
  return displayedChoices.map((text) => {
    const index = quiz.choices.indexOf(text);
    const raw = index >= 0 ? quiz.choiceExplanations[index] : undefined;
    return {
      text,
      isCorrect: judgeAnswer(quiz, text),
      explanation: raw ? raw : null,
    };
  });
}

// 解説まわりの入力検証。エラーメッセージの配列を返す（正しければ空配列）。
export function validateExplanationFields(input: {
  quizType: QuizType;
  choices: string[];
  choiceExplanations: string[];
  basisYear: number | null;
}): string[] {
  const errors: string[] = [];
  const { quizType, choices, choiceExplanations, basisYear } = input;

  if (
    choiceExplanations.length !== 0 &&
    choiceExplanations.length !== choices.length
  ) {
    errors.push("選択肢ごとの解説は、空にするか選択肢と同じ数にしてください");
  }
  if (quizType === "MULTIPLE_CHOICE" && new Set(choices).size !== choices.length) {
    errors.push("選択肢に同じ文字列を2つ入れることはできません");
  }
  if (
    basisYear !== null &&
    (!Number.isInteger(basisYear) || basisYear < 1900 || basisYear > 2100)
  ) {
    errors.push("基準年度は1900〜2100の整数で指定してください");
  }
  return errors;
}

// 空白のみの選択肢を、対応する解説ごと取り除く（位置をそろえたまま）。
// 残った解説がすべて空なら choiceExplanations は [] にする。
export function compactChoices(
  choices: string[],
  choiceExplanations: string[],
): { choices: string[]; choiceExplanations: string[] } {
  const kept: string[] = [];
  const keptExplanations: string[] = [];
  choices.forEach((choice, i) => {
    if (choice.trim() === "") return;
    kept.push(choice);
    keptExplanations.push(choiceExplanations[i] ?? "");
  });
  return {
    choices: kept,
    choiceExplanations: keptExplanations.every((e) => e === "")
      ? []
      : keptExplanations,
  };
}

// 解説に「未確認」の注意書きを添えるか。検証済みでない問題（過去問の AI 解説など）は添える
export function isExplanationUnverified(quiz: {
  verificationStatus: VerificationStatus;
}): boolean {
  return quiz.verificationStatus !== "VERIFIED";
}
