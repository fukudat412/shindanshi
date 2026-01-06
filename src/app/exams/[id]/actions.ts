"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DEFAULT_USER_ID = "default-user";

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
      userId: DEFAULT_USER_ID,
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

  revalidatePath(`/exams/${examId}`);
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
    const isCorrect = checkAnswer(answer.quiz, answer.userAnswer);
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

// 回答の正誤判定
function checkAnswer(
  quiz: { quizType: string; answer: string },
  userAnswer: string | null
): boolean {
  if (!userAnswer) return false;

  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  const normalizedCorrectAnswer = quiz.answer.trim().toLowerCase();

  switch (quiz.quizType) {
    case "TRUE_FALSE":
      return normalizedUserAnswer === normalizedCorrectAnswer;
    case "MULTIPLE_CHOICE":
      return normalizedUserAnswer === normalizedCorrectAnswer;
    case "SHORT_TEXT":
      return normalizedUserAnswer === normalizedCorrectAnswer;
    case "NUMBER": {
      const userNum = parseFloat(normalizedUserAnswer);
      const correctNum = parseFloat(normalizedCorrectAnswer);
      // NaNチェック
      if (isNaN(userNum) || isNaN(correctNum)) return false;
      // 浮動小数点数の精度を考慮した比較
      const epsilon = 0.0001;
      return Math.abs(userNum - correctNum) < epsilon;
    }
    default:
      return normalizedUserAnswer === normalizedCorrectAnswer;
  }
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
