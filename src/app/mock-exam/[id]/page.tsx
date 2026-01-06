import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { ExamClient } from "./exam-client";

export const dynamic = "force-dynamic";

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

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? (await getOrCreateGuestUser());

  const exam = await prisma.mockExam.findUnique({
    where: { id },
    include: {
      answers: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!exam || exam.userId !== userId) {
    notFound();
  }

  // 完了済みの場合は結果画面へリダイレクト
  if (exam.status === "COMPLETED" || exam.status === "ABANDONED") {
    redirect(`/mock-exam/${id}/result`);
  }

  // クイズ情報を取得
  const quizIds = exam.answers.map((a) => a.quizId);
  const quizzes = await prisma.quiz.findMany({
    where: { id: { in: quizIds } },
    include: {
      article: {
        include: { subject: true },
      },
    },
  });

  const quizMap = new Map(quizzes.map((q) => [q.id, q]));

  // 回答データを整形
  const examQuizzes = exam.answers.map((answer) => {
    const quiz = quizMap.get(answer.quizId)!;
    return {
      id: quiz.id,
      question: quiz.question,
      quizType: quiz.quizType,
      choices: quiz.choices,
      subjectName: quiz.article.subject.name,
      userAnswer: answer.userAnswer,
      isMarked: answer.isMarked,
      order: answer.order,
    };
  });

  // 経過時間を計算
  const now = new Date();
  let elapsedSeconds = Math.floor(
    (now.getTime() - exam.startedAt.getTime()) / 1000
  );

  // 一時停止中の場合、pausedAtからの時間は含めない
  if (exam.status === "PAUSED" && exam.pausedAt) {
    elapsedSeconds = Math.floor(
      (exam.pausedAt.getTime() - exam.startedAt.getTime()) / 1000
    );
  }

  // 一時停止していた合計時間を差し引く
  elapsedSeconds -= exam.pausedDuration;

  const remainingSeconds = Math.max(0, exam.timeLimit * 60 - elapsedSeconds);

  // 科目名を取得
  const subjects = await prisma.subject.findMany({
    where: { id: { in: exam.subjectIds } },
  });
  const subjectNames = subjects.map((s) => s.name);

  return (
    <ExamClient
      examId={exam.id}
      title={exam.title || subjectNames.join(", ")}
      quizzes={examQuizzes}
      initialRemainingSeconds={remainingSeconds}
      isPaused={exam.status === "PAUSED"}
      timeLimit={exam.timeLimit}
    />
  );
}
