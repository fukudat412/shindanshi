"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * エラーオブジェクトから適切なエラーメッセージを生成する
 */
function getErrorMessage(error: unknown, fallbackMessage: string): string {
  // Prismaのエラーを処理
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return "データの重複エラーが発生しました。既に同じデータが存在します。";
      case "P2003":
        return "関連するデータが見つかりません。";
      case "P2025":
        return "指定されたデータが見つかりません。";
      default:
        return `データベースエラーが発生しました (${error.code})`;
    }
  }

  // Prismaの検証エラー
  if (error instanceof Prisma.PrismaClientValidationError) {
    return "入力データの形式が正しくありません。";
  }

  // 接続エラー
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return "データベースへの接続に失敗しました。時間をおいて再度お試しください。";
  }

  // 一般的なErrorオブジェクト
  if (error instanceof Error) {
    // 開発環境では詳細なエラーメッセージを返す
    if (process.env.NODE_ENV === "development") {
      return `${fallbackMessage}: ${error.message}`;
    }
  }

  // その他のエラーの場合はフォールバックメッセージを使用
  return fallbackMessage;
}

type CreateQuizInput = {
  articleId: string;
  topicId?: string | null;
  question: string;
  quizType: "TRUE_FALSE" | "SHORT_TEXT" | "NUMBER" | "MULTIPLE_CHOICE";
  phase: "INTRO" | "UNDERSTAND" | "RETAIN" | "EXAM";
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
        phase: input.phase,
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
    const errorMessage = getErrorMessage(error, "クイズの作成に失敗しました");
    return { success: false, error: errorMessage };
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
    const errorMessage = getErrorMessage(error, "クイズの削除に失敗しました");
    return { success: false, error: errorMessage };
  }
}
