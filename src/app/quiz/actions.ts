"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_ID = "default-user";

export async function saveQuizResult(quizId: string, score: number) {
  await prisma.userProgress.upsert({
    where: {
      userId_targetType_targetId: {
        userId: DEFAULT_USER_ID,
        targetType: "QUIZ",
        targetId: quizId,
      },
    },
    update: {
      status: score === 100 ? "COMPLETED" : "IN_PROGRESS",
      score,
      lastAccessedAt: new Date(),
    },
    create: {
      userId: DEFAULT_USER_ID,
      targetType: "QUIZ",
      targetId: quizId,
      status: score === 100 ? "COMPLETED" : "IN_PROGRESS",
      score,
    },
  });

  revalidatePath("/");
}
