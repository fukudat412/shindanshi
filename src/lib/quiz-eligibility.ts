import type { Prisma } from "@/generated/prisma/client";
import type { QuizOrigin, VerificationStatus } from "@/generated/prisma/enums";

// 出題してよい問題か。verified か過去問（検証状態によらない）だけを出題する
export function isServableQuiz(quiz: {
  origin: QuizOrigin;
  verificationStatus: VerificationStatus;
}): boolean {
  return quiz.verificationStatus === "VERIFIED" || quiz.origin === "PAST_EXAM";
}

// isServableQuiz と同じ条件の Prisma where
export const servableQuizWhere: Prisma.QuizWhereInput = {
  OR: [{ verificationStatus: "VERIFIED" }, { origin: "PAST_EXAM" }],
};
