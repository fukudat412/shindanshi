"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { calculateSM2 } from "@/lib/spaced-repetition";

async function getOrCreateGuestUser() {
  const guestEmail = "guest@shindanshi.local";
  let user = await prisma.user.findUnique({ where: { email: guestEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: guestEmail,
        name: "ゲストユーザー",
      },
    });
  }
  return user.id;
}

// Fisher-Yatesアルゴリズムによる偏りのないシャッフル
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 模擬試験の作成
export async function createMockExam(
  subjectIds: string[],
  questionCount: number,
  timeLimit: number,
  title?: string
) {
  const session = await auth();
  const userId = session?.user?.id ?? (await getOrCreateGuestUser());

  // 選択した科目からランダムにクイズを取得
  const quizzes = await prisma.quiz.findMany({
    where: {
      article: {
        subjectId: { in: subjectIds },
      },
    },
    select: { id: true },
  });

  // シャッフルして指定数を選択
  const shuffled = shuffle(quizzes);
  const selectedQuizzes = shuffled.slice(0, questionCount);

  // 模擬試験を作成
  const mockExam = await prisma.mockExam.create({
    data: {
      userId,
      title: title || null,
      subjectIds,
      questionCount: selectedQuizzes.length,
      timeLimit,
      status: "IN_PROGRESS",
      answers: {
        create: selectedQuizzes.map((quiz, index) => ({
          quizId: quiz.id,
          order: index + 1,
        })),
      },
    },
  });

  return mockExam.id;
}

// 模擬試験の回答を保存（個別）
export async function saveExamAnswer(
  examId: string,
  quizId: string,
  userAnswer: string | null,
  timeSpent: number
) {
  await prisma.mockExamAnswer.update({
    where: {
      mockExamId_quizId: {
        mockExamId: examId,
        quizId,
      },
    },
    data: {
      userAnswer,
      timeSpent,
    },
  });
}

// マーク状態の切り替え
export async function toggleMarkAnswer(examId: string, quizId: string) {
  const answer = await prisma.mockExamAnswer.findUnique({
    where: {
      mockExamId_quizId: {
        mockExamId: examId,
        quizId,
      },
    },
  });

  if (!answer) return;

  await prisma.mockExamAnswer.update({
    where: {
      mockExamId_quizId: {
        mockExamId: examId,
        quizId,
      },
    },
    data: {
      isMarked: !answer.isMarked,
    },
  });
}

// 試験の一時停止
export async function pauseExam(examId: string) {
  await prisma.mockExam.update({
    where: { id: examId },
    data: {
      status: "PAUSED",
      pausedAt: new Date(),
    },
  });
  revalidatePath("/mock-exam");
}

// 試験の再開
export async function resumeExam(examId: string) {
  const exam = await prisma.mockExam.findUnique({
    where: { id: examId },
  });

  if (!exam || !exam.pausedAt) return;

  const pausedDuration = Math.floor(
    (new Date().getTime() - exam.pausedAt.getTime()) / 1000
  );

  await prisma.mockExam.update({
    where: { id: examId },
    data: {
      status: "IN_PROGRESS",
      pausedAt: null,
      pausedDuration: { increment: pausedDuration },
    },
  });

  revalidatePath("/mock-exam");
}

// 数値比較のヘルパー関数（浮動小数点数の精度を考慮）
function compareNumbers(userAnswer: string, correctAnswer: string): boolean {
  const userNum = parseFloat(userAnswer);
  const correctNum = parseFloat(correctAnswer);
  if (isNaN(userNum) || isNaN(correctNum)) return false;
  const epsilon = 0.0001;
  return Math.abs(userNum - correctNum) < epsilon;
}

// 試験の提出（完了）
export async function submitExam(examId: string) {
  const exam = await prisma.mockExam.findUnique({
    where: { id: examId },
    include: {
      answers: {
        include: {
          mockExam: true,
        },
      },
    },
  });

  if (!exam) return;

  // 各回答の正誤判定
  const answers = await prisma.mockExamAnswer.findMany({
    where: { mockExamId: examId },
  });

  const quizIds = answers.map((a) => a.quizId);
  const quizzes = await prisma.quiz.findMany({
    where: { id: { in: quizIds } },
  });

  const quizMap = new Map(quizzes.map((q) => [q.id, q]));

  // 既存のUserProgressを一括取得
  const existingProgress = await prisma.userProgress.findMany({
    where: {
      userId: exam.userId,
      targetType: "QUIZ",
      targetId: { in: quizIds },
    },
  });
  const progressMap = new Map(existingProgress.map((p) => [p.targetId, p]));

  let correctCount = 0;

  // 正誤判定の結果を収集
  const answerResults: { answerId: string; isCorrect: boolean; quizId: string }[] = [];

  for (const answer of answers) {
    const quiz = quizMap.get(answer.quizId);
    if (!quiz || !answer.userAnswer) {
      answerResults.push({ answerId: answer.id, isCorrect: false, quizId: answer.quizId });
      continue;
    }

    const normalizedUserAnswer = answer.userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = quiz.answer.trim().toLowerCase();

    let isCorrect = false;
    if (quiz.quizType === "NUMBER") {
      isCorrect = compareNumbers(normalizedUserAnswer, normalizedCorrectAnswer);
    } else {
      isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    }

    if (isCorrect) correctCount++;
    answerResults.push({ answerId: answer.id, isCorrect, quizId: answer.quizId });
  }

  // トランザクションで一括更新
  await prisma.$transaction(async (tx) => {
    // 回答の正誤を一括更新
    for (const result of answerResults) {
      await tx.mockExamAnswer.update({
        where: { id: result.answerId },
        data: { isCorrect: result.isCorrect },
      });
    }

    // UserProgressを一括upsert
    for (const result of answerResults) {
      const quiz = quizMap.get(result.quizId);
      if (!quiz) continue;

      const existing = progressMap.get(quiz.id);
      const sm2Result = calculateSM2({
        isCorrect: result.isCorrect,
        easeFactor: existing?.easeFactor ?? 2.5,
        interval: existing?.interval ?? 0,
        repetitions: existing?.repetitions ?? 0,
      });

      await tx.userProgress.upsert({
        where: {
          userId_targetType_targetId: {
            userId: exam.userId,
            targetType: "QUIZ",
            targetId: quiz.id,
          },
        },
        update: {
          status: result.isCorrect ? "COMPLETED" : "IN_PROGRESS",
          score: result.isCorrect ? 100 : 0,
          lastAccessedAt: new Date(),
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReviewAt: sm2Result.nextReviewAt,
          attemptCount: { increment: 1 },
        },
        create: {
          userId: exam.userId,
          targetType: "QUIZ",
          targetId: quiz.id,
          status: result.isCorrect ? "COMPLETED" : "IN_PROGRESS",
          score: result.isCorrect ? 100 : 0,
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReviewAt: sm2Result.nextReviewAt,
          attemptCount: 1,
        },
      });
    }

    // 模擬試験を完了状態に更新
    await tx.mockExam.update({
      where: { id: examId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        score: correctCount,
      },
    });
  });

  revalidatePath("/mock-exam");
  redirect(`/mock-exam/${examId}/result`);
}

// 試験の放棄
export async function abandonExam(examId: string) {
  await prisma.mockExam.update({
    where: { id: examId },
    data: {
      status: "ABANDONED",
      completedAt: new Date(),
    },
  });

  revalidatePath("/mock-exam");
  redirect("/mock-exam");
}
