"use server";

import { judgeAnswer } from "@/lib/answer-judge";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user-utils";
import { redirect } from "next/navigation";
import { calculateSM2 } from "@/lib/spaced-repetition";
import { shuffle } from "@/lib/shuffle";

// 試験の所有権と状態を検証
async function validateExamAccess(
  examId: string,
  userId: string,
  allowedStatuses?: string[]
): Promise<{ userId: string; status: string }> {
  const exam = await prisma.mockExam.findUnique({
    where: { id: examId },
    select: { userId: true, status: true },
  });

  if (!exam) {
    throw new Error("試験が見つかりません");
  }

  if (exam.userId !== userId) {
    throw new Error("この試験にアクセスする権限がありません");
  }

  if (allowedStatuses && !allowedStatuses.includes(exam.status)) {
    throw new Error("この試験は既に完了または放棄されています");
  }

  return exam;
}

// 模擬試験の作成
export async function createMockExam(
  subjectIds: string[],
  questionCount: number,
  timeLimit: number,
  title?: string
) {
  const userId = await getCurrentUserId();

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
  try {
    const userId = await getCurrentUserId();
    await validateExamAccess(examId, userId, ["IN_PROGRESS", "PAUSED"]);

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
  } catch (error) {
    console.error("回答の保存に失敗しました:", error);
    throw new Error("回答の保存に失敗しました");
  }
}

// マーク状態の切り替え
export async function toggleMarkAnswer(examId: string, quizId: string) {
  try {
    const userId = await getCurrentUserId();
    await validateExamAccess(examId, userId, ["IN_PROGRESS", "PAUSED"]);

    const answer = await prisma.mockExamAnswer.findUnique({
      where: {
        mockExamId_quizId: {
          mockExamId: examId,
          quizId,
        },
      },
    });

    if (!answer) {
      throw new Error("回答が見つかりません");
    }

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
  } catch (error) {
    console.error("マーク状態の切り替えに失敗しました:", error);
    throw new Error("マーク状態の切り替えに失敗しました");
  }
}

// 試験の一時停止
export async function pauseExam(examId: string) {
  try {
    const userId = await getCurrentUserId();
    await validateExamAccess(examId, userId, ["IN_PROGRESS"]);

    await prisma.mockExam.update({
      where: { id: examId },
      data: {
        status: "PAUSED",
        pausedAt: new Date(),
      },
    });
    revalidatePath("/mock-exam");
  } catch (error) {
    console.error("試験の一時停止に失敗しました:", error);
    throw new Error("試験の一時停止に失敗しました");
  }
}

// 試験の再開
export async function resumeExam(examId: string) {
  try {
    const userId = await getCurrentUserId();
    await validateExamAccess(examId, userId, ["PAUSED"]);

    const exam = await prisma.mockExam.findUnique({
      where: { id: examId },
    });

    if (!exam || !exam.pausedAt) {
      throw new Error("一時停止中の試験が見つかりません");
    }

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
  } catch (error) {
    console.error("試験の再開に失敗しました:", error);
    throw new Error("試験の再開に失敗しました");
  }
}

// 試験の提出（完了）
export async function submitExam(examId: string) {
  try {
    const userId = await getCurrentUserId();
    await validateExamAccess(examId, userId, ["IN_PROGRESS", "PAUSED"]);

    const exam = await prisma.mockExam.findUnique({
      where: { id: examId },
      include: {
        answers: true,
      },
    });

    if (!exam) {
      throw new Error("試験が見つかりません");
    }

    // 各回答の正誤判定（answersはexamから取得済み）
    const answers = exam.answers;

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
      if (!quiz) {
        answerResults.push({ answerId: answer.id, isCorrect: false, quizId: answer.quizId });
        continue;
      }

      const isCorrect = judgeAnswer(quiz, answer.userAnswer);

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
  } catch (error) {
    console.error("試験の提出に失敗しました:", error);
    throw new Error("試験の提出に失敗しました。もう一度お試しください。");
  }
}

// 試験の放棄
export async function abandonExam(examId: string) {
  try {
    const userId = await getCurrentUserId();
    await validateExamAccess(examId, userId, ["IN_PROGRESS", "PAUSED"]);

    await prisma.mockExam.update({
      where: { id: examId },
      data: {
        status: "ABANDONED",
        completedAt: new Date(),
      },
    });

    revalidatePath("/mock-exam");
    redirect("/mock-exam");
  } catch (error) {
    console.error("試験の放棄に失敗しました:", error);
    throw new Error("試験の放棄に失敗しました");
  }
}
