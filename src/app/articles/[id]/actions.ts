"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user-utils";

export async function markArticleComplete(articleId: string) {
  const userId = await getCurrentUserId();
  await prisma.userProgress.upsert({
    where: {
      userId_targetType_targetId: {
        userId: userId,
        targetType: "ARTICLE",
        targetId: articleId,
      },
    },
    update: {
      status: "COMPLETED",
      lastAccessedAt: new Date(),
    },
    create: {
      userId: userId,
      targetType: "ARTICLE",
      targetId: articleId,
      status: "COMPLETED",
    },
  });

  revalidatePath("/");
  revalidatePath(`/articles/${articleId}`);
}
