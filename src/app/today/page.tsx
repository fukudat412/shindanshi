import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user-utils";
import { buildTodayQueue, queueReasonLabel } from "@/lib/today-queue";
import { shuffleChoicesForDisplay } from "@/lib/quiz-display";
import { buildChoiceFeedback, isExplanationUnverified } from "@/lib/quiz-explanation";
import { quizImagesInclude } from "@/lib/quiz-image";
import { servableQuizWhere } from "@/lib/quiz-eligibility";
import { formatQuizSource } from "@/lib/past-exam";
import { QuizClient } from "@/app/quiz/quiz-client";
import { TodayQueueSummary } from "./queue-summary";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const userId = await getCurrentUserId();
  const [progress, quizzes] = await Promise.all([
    prisma.userProgress.findMany({ where: { userId, targetType: "QUIZ" } }),
    prisma.quiz.findMany({
      where: servableQuizWhere,
      include: { images: quizImagesInclude },
      orderBy: [
        { article: { subject: { order: "asc" } } },
        { article: { order: "asc" } },
        { order: "asc" },
      ],
    }),
  ]);

  const queue = buildTodayQueue({
    quizzes: quizzes.map((q) => ({ id: q.id, topicId: q.topicId })),
    progress,
    now: new Date(),
  });

  const quizById = new Map(quizzes.map((q) => [q.id, q]));
  const counts = { due: 0, weak: 0, new: 0 };
  const items = queue.flatMap((item) => {
    const q = quizById.get(item.quizId);
    if (!q) return [];
    counts[item.reason] += 1;
    const shuffled = shuffleChoicesForDisplay(q);
    return [
      {
        id: q.id,
        question: q.question,
        quizType: q.quizType,
        answer: q.answer,
        choices: shuffled.choices,
        explanation: q.explanation,
        choiceFeedback: buildChoiceFeedback(q, shuffled.choices),
        basis: q.basis,
        basisYear: q.basisYear,
        sourceLabel: formatQuizSource(q),
        images: q.images,
        explanationUnverified: isExplanationUnverified(q),
        label: queueReasonLabel(item.reason),
      },
    ];
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">今日のキュー</h1>
        <TodayQueueSummary counts={counts} />
      </div>
      {items.length > 0 && <QuizClient quizzes={items} />}
    </div>
  );
}
