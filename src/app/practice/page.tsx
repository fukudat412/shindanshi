import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PracticeClient } from "./practice-client";
import { ChevronLeft, Shuffle } from "lucide-react";

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

async function getSubjects() {
  return prisma.subject.findMany({
    include: {
      articles: {
        include: {
          _count: { select: { quizzes: true } },
        },
      },
    },
    orderBy: { order: "asc" },
  });
}

async function getRandomQuizzes(
  subjectIds: string[],
  count: number,
  mode?: string,
  userId?: string
) {
  // 弱点モードの場合、間違えた問題を優先
  if (mode === "weakness" && userId) {
    const weakQuizProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        targetType: "QUIZ",
        OR: [{ score: 0 }, { score: null }, { status: "IN_PROGRESS" }],
      },
      select: { targetId: true },
    });

    const weakQuizIds = weakQuizProgress.map((p) => p.targetId);

    if (weakQuizIds.length > 0) {
      const weakQuizzes = await prisma.quiz.findMany({
        where: {
          id: { in: weakQuizIds },
          article: { subjectId: { in: subjectIds } },
        },
        include: {
          article: { include: { subject: true } },
        },
      });

      // シャッフルして指定数を返す
      const shuffled = weakQuizzes.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
  }

  // 通常モード: 選択された科目からランダムに取得
  const quizzes = await prisma.quiz.findMany({
    where: {
      article: {
        subjectId: { in: subjectIds },
      },
    },
    include: {
      article: { include: { subject: true } },
    },
  });

  // シャッフルして指定数を返す
  const shuffled = quizzes.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{
    subjectIds?: string;
    count?: string;
    mode?: string;
    started?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session?.user?.id ?? await getOrCreateGuestUser();
  const subjects = await getSubjects();

  // 科目ごとのクイズ数を計算
  const subjectsWithQuizCount = subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    quizCount: subject.articles.reduce(
      (acc, article) => acc + article._count.quizzes,
      0
    ),
  }));

  // パラメータが指定されていて、startedフラグがある場合はクイズを取得
  let quizzes = null;
  if (params.started === "true" && params.subjectIds) {
    const ids = params.subjectIds.split(",");
    const count = parseInt(params.count ?? "10", 10);
    quizzes = await getRandomQuizzes(ids, count, params.mode, userId);
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          ホームに戻る
        </Link>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary shrink-0">
            <Shuffle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">ランダム演習</h1>
            <p className="text-muted-foreground mt-1">
              {params.mode === "weakness"
                ? "苦手な問題を集中的に練習します"
                : "複数科目からランダムに出題します"}
            </p>
          </div>
        </div>
      </div>

      <PracticeClient
        subjects={subjectsWithQuizCount}
        initialQuizzes={
          quizzes?.map((q) => ({
            id: q.id,
            question: q.question,
            quizType: q.quizType,
            answer: q.answer,
            choices: q.choices,
            explanation: q.explanation,
            subjectName: q.article.subject.name,
          })) ?? null
        }
        mode={params.mode}
        initialSubjectIds={params.subjectIds?.split(",") ?? null}
        initialCount={params.count ? parseInt(params.count, 10) : null}
      />
    </div>
  );
}
