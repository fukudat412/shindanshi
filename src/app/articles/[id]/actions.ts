"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_ID = "default-user";

export async function markArticleComplete(articleId: string) {
  await prisma.userProgress.upsert({
    where: {
      userId_targetType_targetId: {
        userId: DEFAULT_USER_ID,
        targetType: "ARTICLE",
        targetId: articleId,
      },
    },
    update: {
      status: "COMPLETED",
      lastAccessedAt: new Date(),
    },
    create: {
      userId: DEFAULT_USER_ID,
      targetType: "ARTICLE",
      targetId: articleId,
      status: "COMPLETED",
    },
  });

  revalidatePath("/");
  revalidatePath(`/articles/${articleId}`);
}
