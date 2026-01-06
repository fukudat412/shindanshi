"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 過去問を作成
export async function createExam(formData: FormData) {
  const name = formData.get("name") as string;
  const year = parseInt(formData.get("year") as string);
  const session = parseInt(formData.get("session") as string);
  const subjectId = formData.get("subjectId") as string;
  const timeLimit = parseInt(formData.get("timeLimit") as string);

  if (!name || !year || !session || !subjectId || !timeLimit) {
    throw new Error("必須項目を入力してください");
  }

  const exam = await prisma.exam.create({
    data: {
      name,
      year,
      session,
      subjectId,
      timeLimit,
    },
  });

  revalidatePath("/admin/exams");
  revalidatePath("/exams");
  redirect(`/admin/exams/${exam.id}`);
}

// 過去問を更新
export async function updateExam(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const year = parseInt(formData.get("year") as string);
  const session = parseInt(formData.get("session") as string);
  const subjectId = formData.get("subjectId") as string;
  const timeLimit = parseInt(formData.get("timeLimit") as string);

  if (!name || !year || !session || !subjectId || !timeLimit) {
    throw new Error("必須項目を入力してください");
  }

  await prisma.exam.update({
    where: { id },
    data: {
      name,
      year,
      session,
      subjectId,
      timeLimit,
    },
  });

  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${id}`);
  revalidatePath("/exams");
}

// 過去問を削除
export async function deleteExam(id: string) {
  await prisma.exam.delete({
    where: { id },
  });

  revalidatePath("/admin/exams");
  revalidatePath("/exams");
}

// 問題を追加
export async function addQuestionToExam(examId: string, quizId: string) {
  // 現在の最大orderを取得
  const maxOrder = await prisma.examQuestion.aggregate({
    where: { examId },
    _max: { order: true },
  });

  const nextOrder = (maxOrder._max.order || 0) + 1;

  await prisma.examQuestion.create({
    data: {
      examId,
      quizId,
      order: nextOrder,
    },
  });

  revalidatePath(`/admin/exams/${examId}`);
  revalidatePath("/exams");
}

// 問題を削除
export async function removeQuestionFromExam(examId: string, quizId: string) {
  await prisma.examQuestion.delete({
    where: {
      examId_quizId: {
        examId,
        quizId,
      },
    },
  });

  // 順序を再整理
  const remaining = await prisma.examQuestion.findMany({
    where: { examId },
    orderBy: { order: "asc" },
  });

  await Promise.all(
    remaining.map((q, index) =>
      prisma.examQuestion.update({
        where: { id: q.id },
        data: { order: index + 1 },
      })
    )
  );

  revalidatePath(`/admin/exams/${examId}`);
  revalidatePath("/exams");
}

// 問題の順序を変更
export async function reorderQuestions(
  examId: string,
  questionOrders: { quizId: string; order: number }[]
) {
  await Promise.all(
    questionOrders.map(({ quizId, order }) =>
      prisma.examQuestion.update({
        where: {
          examId_quizId: {
            examId,
            quizId,
          },
        },
        data: { order },
      })
    )
  );

  revalidatePath(`/admin/exams/${examId}`);
  revalidatePath("/exams");
}
