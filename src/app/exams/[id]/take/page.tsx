import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ExamTakeClient from "./ExamTakeClient";
import { startExam, getAttempt } from "../actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string }>;
};

export default async function ExamTakePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { attemptId } = await searchParams;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      subject: true,
      questions: {
        include: { quiz: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  // 既存の受験記録があれば再開、なければ新規作成
  let attempt;
  if (attemptId) {
    attempt = await getAttempt(attemptId);
    if (!attempt || attempt.status === "COMPLETED") {
      redirect(`/exams/${id}`);
    }
  } else {
    attempt = await startExam(id);
  }

  // Quizデータを整形
  const questions = exam.questions.map((q, index) => ({
    id: q.quiz.id,
    order: index + 1,
    question: q.quiz.question,
    quizType: q.quiz.quizType,
    choices: q.quiz.choices,
    answer: q.quiz.answer,
    explanation: q.quiz.explanation,
  }));

  // 既存の回答をマップ
  const answersMap: Record<string, string> = {};
  for (const answer of attempt.answers) {
    if (answer.userAnswer) {
      answersMap[answer.quizId] = answer.userAnswer;
    }
  }

  return (
    <ExamTakeClient
      exam={{
        id: exam.id,
        name: exam.name,
        subject: exam.subject.name,
        timeLimit: exam.timeLimit,
      }}
      attemptId={attempt.id}
      remainingTime={attempt.remainingTime || exam.timeLimit * 60}
      questions={questions}
      initialAnswers={answersMap}
    />
  );
}
