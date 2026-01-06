"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TargetType } from "@prisma/client";

export async function toggleBookmark(targetType: TargetType, targetId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "ログインが必要です" };
  }

  const userId = session.user.id;

  try {
    // 既存のブックマークを確認
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType,
          targetId,
        },
      },
    });

    if (existing) {
      // 削除
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      revalidatePath("/bookmarks");
      return { success: true, bookmarked: false };
    } else {
      // 追加
      await prisma.bookmark.create({
        data: {
          userId,
          targetType,
          targetId,
        },
      });
      revalidatePath("/bookmarks");
      return { success: true, bookmarked: true };
    }
  } catch (error) {
    console.error("Failed to toggle bookmark:", error);
    return { success: false, error: "ブックマークの更新に失敗しました" };
  }
}

export async function isBookmarked(targetType: TargetType, targetId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return false;
  }

  const bookmark = await prisma.bookmark.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: session.user.id,
        targetType,
        targetId,
      },
    },
  });

  return !!bookmark;
}

export async function getBookmarks() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // 記事とクイズの詳細を取得
  const articleIds = bookmarks
    .filter((b) => b.targetType === "ARTICLE")
    .map((b) => b.targetId);
  const quizIds = bookmarks
    .filter((b) => b.targetType === "QUIZ")
    .map((b) => b.targetId);

  const [articles, quizzes] = await Promise.all([
    prisma.article.findMany({
      where: { id: { in: articleIds } },
      include: { subject: true },
    }),
    prisma.quiz.findMany({
      where: { id: { in: quizIds } },
      include: {
        article: { include: { subject: true } },
        topic: true,
      },
    }),
  ]);

  // ブックマークに詳細情報を付加
  return bookmarks.map((bookmark) => {
    if (bookmark.targetType === "ARTICLE") {
      const article = articles.find((a) => a.id === bookmark.targetId);
      return {
        ...bookmark,
        article,
        quiz: null,
      };
    } else {
      const quiz = quizzes.find((q) => q.id === bookmark.targetId);
      return {
        ...bookmark,
        article: null,
        quiz,
      };
    }
  });
}
