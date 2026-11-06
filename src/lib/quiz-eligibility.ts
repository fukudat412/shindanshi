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

const verificationStatusLabels: Record<VerificationStatus, string> = {
  DRAFT: "下書き",
  VERIFIED: "検証済み",
  NEEDS_FIX: "要修正",
  REJECTED: "却下",
};

export function verificationStatusLabel(status: VerificationStatus): string {
  return verificationStatusLabels[status];
}

export const verificationStatuses = Object.keys(
  verificationStatusLabels,
) as VerificationStatus[];

// 4値のいずれかならその値、それ以外は null
export function parseVerificationStatus(
  value: string | undefined,
): VerificationStatus | null {
  return verificationStatuses.find((s) => s === value) ?? null;
}
