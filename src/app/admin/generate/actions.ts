"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type QuizInput = {
  question: string;
  quizType: "TRUE_FALSE" | "SHORT_TEXT" | "NUMBER" | "MULTIPLE_CHOICE";
  phase: "INTRO" | "UNDERSTAND" | "RETAIN" | "EXAM";
  answer: string;
  choices: string[];
  explanation: string;
};

type BulkCreateInput = {
  topicId: string;
  articleId: string;
  quizzes: QuizInput[];
};

export async function bulkCreateQuizzes(input: BulkCreateInput) {
  try {
    // 既存のクイズの最大orderを取得
    const maxOrder = await prisma.quiz.aggregate({
      where: { articleId: input.articleId },
      _max: { order: true },
    });

    let currentOrder = (maxOrder._max.order ?? -1) + 1;

    // クイズを一括作成
    const createdQuizzes = await prisma.$transaction(
      input.quizzes.map((quiz) =>
        prisma.quiz.create({
          data: {
            articleId: input.articleId,
            topicId: input.topicId,
            question: quiz.question,
            quizType: quiz.quizType,
            phase: quiz.phase,
            answer: quiz.answer,
            choices: quiz.choices,
            explanation: quiz.explanation || null,
            order: currentOrder++,
          },
        })
      )
    );

    revalidatePath("/admin/quizzes");
    revalidatePath("/admin/generate");

    return { success: true, count: createdQuizzes.length };
  } catch (error) {
    console.error("Failed to bulk create quizzes:", error);
    return { success: false, error: "問題の一括作成に失敗しました" };
  }
}

export async function getTopicsWithArticles() {
  const topics = await prisma.topic.findMany({
    include: {
      subject: true,
      articles: {
        select: {
          id: true,
          title: true,
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: [
      { subject: { order: "asc" } },
      { order: "asc" },
    ],
  });

  return topics;
}
