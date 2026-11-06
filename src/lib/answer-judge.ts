import type { QuizType } from "@/generated/prisma/enums";

const NUMBER_EPSILON = 0.0001;

// 回答の正誤判定。Client / Server の両方から使うので、DB やサーバー専用モジュールには依存しない。
// MULTIPLE_CHOICE は選んだ選択肢の文字列（値）と answer を比べる（位置やラベルは使わない）。
export function judgeAnswer(
  quiz: { quizType: QuizType; answer: string },
  userAnswer: string | null,
): boolean {
  if (userAnswer === null) return false;
  const user = userAnswer.trim().toLowerCase();
  if (user === "") return false;
  const correct = quiz.answer.trim().toLowerCase();

  if (quiz.quizType === "NUMBER") {
    const userNum = parseFloat(user);
    const correctNum = parseFloat(correct);
    if (Number.isNaN(userNum) || Number.isNaN(correctNum)) return false;
    return Math.abs(userNum - correctNum) < NUMBER_EPSILON;
  }
  return user === correct;
}
