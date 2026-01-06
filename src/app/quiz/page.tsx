import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { QuizClient } from "./quiz-client";

export const dynamic = "force-dynamic";

async function getQuizzes(articleId?: string, quizId?: string) {
  if (quizId) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { article: { include: { subject: true } } },
    });
    return quiz ? [quiz] : [];
  }

  if (articleId) {
    return prisma.quiz.findMany({
      where: { articleId },
      include: { article: { include: { subject: true } } },
      orderBy: { order: "asc" },
    });
  }

  return [];
}

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ articleId?: string; quizId?: string }>;
}) {
  const { articleId, quizId } = await searchParams;

  if (!articleId && !quizId) {
    redirect("/subjects");
  }

  const quizzes = await getQuizzes(articleId, quizId);

  // ブックマーク状態を取得
  const session = await auth();
  let bookmarkedQuizIds: string[] = [];
  if (session?.user?.id && quizzes.length > 0) {
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: session.user.id,
        targetType: "QUIZ",
        targetId: { in: quizzes.map((q) => q.id) },
      },
      select: { targetId: true },
    });
    bookmarkedQuizIds = bookmarks.map((b) => b.targetId);
  }

  if (quizzes.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">クイズが見つかりません</h1>
        <p className="text-muted-foreground">
          指定された記事にはクイズがありません。
        </p>
        <Link href="/subjects" className="text-blue-600 hover:underline">
          科目一覧に戻る
        </Link>
      </div>
    );
  }

  const article = quizzes[0].article;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/articles/${article.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {article.title}に戻る
        </Link>
        <h1 className="text-2xl font-bold mt-2">確認クイズ</h1>
        <p className="text-muted-foreground">
          {article.subject.name} - {article.title}
        </p>
      </div>

      <QuizClient
        quizzes={quizzes.map((q) => ({
          id: q.id,
          question: q.question,
          quizType: q.quizType,
          answer: q.answer,
          choices: q.choices,
          explanation: q.explanation,
        }))}
        articleId={article.id}
        bookmarkedQuizIds={bookmarkedQuizIds}
      />
    </div>
  );
}
