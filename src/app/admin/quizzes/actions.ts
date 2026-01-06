"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type CreateQuizInput = {
  articleId: string;
  topicId?: string | null;
  question: string;
  quizType: "TRUE_FALSE" | "SHORT_TEXT" | "NUMBER" | "MULTIPLE_CHOICE";
  answer: string;
  choices?: string[];
  explanation: string | null;
  order: number;
};

export async function createQuiz(input: CreateQuizInput) {
  try {
    await prisma.quiz.create({
      data: {
        articleId: input.articleId,
        topicId: input.topicId || null,
        question: input.question,
        quizType: input.quizType,
        answer: input.answer,
        choices: input.choices ?? [],
        explanation: input.explanation,
        order: input.order,
      },
    });
    revalidatePath("/admin/quizzes");
    revalidatePath(`/articles/${input.articleId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to create quiz:", error);
    return { success: false, error: "クイズの作成に失敗しました" };
  }
}

export async function deleteQuiz(id: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { articleId: true },
    });
    await prisma.quiz.delete({
      where: { id },
    });
    revalidatePath("/admin/quizzes");
    if (quiz) {
      revalidatePath(`/articles/${quiz.articleId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to delete quiz:", error);
    return { success: false, error: "クイズの削除に失敗しました" };
  }
}
