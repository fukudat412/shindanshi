import type { QuizType } from "@/generated/prisma/enums";
import { shuffle } from "@/lib/shuffle";

// 表示用に選択肢を並べ替える。サーバー側で呼ぶこと（クライアント描画中の乱数はハイドレーションずれの原因になる）。
// MULTIPLE_CHOICE 以外はそのまま返す。引数は変更しない。
export function shuffleChoicesForDisplay<
  T extends { quizType: QuizType; choices: string[] },
>(quiz: T, random: () => number = Math.random): T {
  if (quiz.quizType !== "MULTIPLE_CHOICE") return quiz;
  return { ...quiz, choices: shuffle(quiz.choices, random) };
}
