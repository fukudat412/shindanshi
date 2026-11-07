"use server";

import { judgeAnswer } from "@/lib/answer-judge";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/user-utils";

// 試験を開始する
export async function startExam(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        include: { quiz: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!exam) {
    throw new Error("試験が見つかりません");
  }

  // 新しい受験記録を作成
  const attempt = await prisma.examAttempt.create({
    data: {
      userId: await getCurrentUserId(),
      examId,
      status: "IN_PROGRESS",
      remainingTime: exam.timeLimit * 60, // 分を秒に変換
      answers: {
        create: exam.questions.map((q) => ({
          quizId: q.quizId,
        })),
      },
    },
    include: {
      answers: true,
    },
  });

  // 受験ページの描画中に呼ばれるので revalidatePath は呼べない（Next 16 では描画中の呼び出しがエラーになる）。
  // /exams 以下のページは force-dynamic なので、再検証しなくても最新の記録が表示される
  return attempt;
}

// 回答を保存する
export async function saveAnswer(
  attemptId: string,
  quizId: string,
  userAnswer: string
) {
  const answer = await prisma.examAnswer.update({
    where: {
      attemptId_quizId: {
        attemptId,
        quizId,
      },
    },
    data: {
      userAnswer,
      answeredAt: new Date(),
    },
  });

  return answer;
}

// 残り時間を更新する（中断時）
export async function pauseExam(attemptId: string, remainingTime: number) {
  const attempt = await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: "PAUSED",
      remainingTime,
    },
  });

  revalidatePath("/exams");
  return attempt;
}

// 試験を終了する
export async function finishExam(attemptId: string) {
  // 回答を取得して採点
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: {
            include: { quiz: true },
          },
        },
      },
      answers: {
        include: { quiz: true },
      },
    },
  });

  if (!attempt) {
    throw new Error("受験記録が見つかりません");
  }

  // 各回答の正誤判定
  let correctCount = 0;
  const answerUpdates = attempt.answers.map((answer) => {
    const isCorrect = judgeAnswer(answer.quiz, answer.userAnswer);
    if (isCorrect) correctCount++;

    return prisma.examAnswer.update({
      where: { id: answer.id },
      data: { isCorrect },
    });
  });

  await Promise.all(answerUpdates);

  // スコア計算と試験完了
  const totalQuestions = attempt.exam.questions.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const updatedAttempt = await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: "COMPLETED",
      finishedAt: new Date(),
      score,
    },
  });

  revalidatePath("/exams");
  revalidatePath(`/exams/${attempt.examId}`);
  return updatedAttempt;
}

// 受験記録を取得
export async function getAttempt(attemptId: string) {
  return prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          subject: true,
          questions: {
            include: { quiz: true },
            orderBy: { order: "asc" },
          },
        },
      },
      answers: true,
    },
  });
}
