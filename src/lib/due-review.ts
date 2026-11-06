import { prisma } from "@/lib/prisma";
import { servableQuizWhere } from "@/lib/quiz-eligibility";

// 復習が必要な進捗（SM-2 に基づく）の条件
export function dueProgressWhere(userId: string, now: Date) {
  return {
    userId,
    targetType: "QUIZ" as const,
    OR: [
      // 復習期限が過ぎている
      { nextReviewAt: { lte: now } },
      // まだ一度も正解していない
      { status: "IN_PROGRESS" as const },
      // nextReviewAtが設定されていない（既存データ対応）
      { nextReviewAt: null, attemptCount: { gt: 0 } },
    ],
  };
}

// 復習リスト（先頭 limit 件）と復習待ち件数。出題対象外の問題は数えず、出さない
export async function getDueReviews(
  userId: string,
  now: Date = new Date(),
  limit = 5,
  db: Pick<typeof prisma, "userProgress" | "quiz"> = prisma,
) {
  const dueProgress = await db.userProgress.findMany({
    where: dueProgressWhere(userId, now),
    orderBy: [{ nextReviewAt: "asc" }], // 最も期限が古いものから
  });

  const quizzes = await db.quiz.findMany({
    where: {
      AND: [{ id: { in: dueProgress.map((p) => p.targetId) } }, servableQuizWhere],
    },
    include: {
      article: { include: { subject: true } },
      topic: true,
    },
  });
  const quizMap = new Map(quizzes.map((q) => [q.id, q]));

  const servable = dueProgress.flatMap((progress) => {
    const quiz = quizMap.get(progress.targetId);
    return quiz ? [{ ...progress, quiz }] : [];
  });

  return { dueQuizzes: servable.slice(0, limit), dueCount: servable.length };
}
