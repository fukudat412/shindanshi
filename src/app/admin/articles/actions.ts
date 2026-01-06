"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type CreateArticleInput = {
  subjectId: string;
  topicId?: string | null;
  title: string;
  bodyMd: string;
  tags: string[];
  order: number;
};

export async function createArticle(input: CreateArticleInput) {
  try {
    await prisma.article.create({
      data: {
        subjectId: input.subjectId,
        topicId: input.topicId || null,
        title: input.title,
        bodyMd: input.bodyMd,
        tags: input.tags,
        order: input.order,
      },
    });
    revalidatePath("/admin/articles");
    revalidatePath(`/subjects/${input.subjectId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create article:", error);
    return { success: false, error: "記事の作成に失敗しました" };
  }
}

export async function deleteArticle(id: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      select: { subjectId: true },
    });
    await prisma.article.delete({
      where: { id },
    });
    revalidatePath("/admin/articles");
    if (article) {
      revalidatePath(`/subjects/${article.subjectId}`);
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete article:", error);
    return { success: false, error: "記事の削除に失敗しました" };
  }
}
