"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calculateSM2 } from "@/lib/spaced-repetition";

async function getOrCreateGuestUser() {
  const guestEmail = "guest@shindanshi.local";
  let user = await prisma.user.findUnique({ where: { email: guestEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: guestEmail,
        name: "ゲストユーザー",
      },
    });
  }
  return user.id;
}

export async function saveQuizResult(quizId: string, score: number) {
  const session = await auth();
  const userId = session?.user?.id ?? await getOrCreateGuestUser();

  // 既存の進捗を取得（SM-2計算に必要）
  const existing = await prisma.userProgress.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType: "QUIZ",
        targetId: quizId,
      },
    },
  });

  // SM-2アルゴリズムで次回復習日を計算
  const sm2Result = calculateSM2({
    isCorrect: score === 100,
    easeFactor: existing?.easeFactor ?? 2.5,
    interval: existing?.interval ?? 0,
    repetitions: existing?.repetitions ?? 0,
  });

  await prisma.userProgress.upsert({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType: "QUIZ",
        targetId: quizId,
      },
    },
    update: {
      status: score === 100 ? "COMPLETED" : "IN_PROGRESS",
      score,
      lastAccessedAt: new Date(),
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      nextReviewAt: sm2Result.nextReviewAt,
      attemptCount: { increment: 1 },
    },
    create: {
      userId,
      targetType: "QUIZ",
      targetId: quizId,
      status: score === 100 ? "COMPLETED" : "IN_PROGRESS",
      score,
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      nextReviewAt: sm2Result.nextReviewAt,
      attemptCount: 1,
    },
  });

  revalidatePath("/");
}
