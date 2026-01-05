import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { BookOpen, CheckCircle, HelpCircle, RefreshCw, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const DEFAULT_USER_ID = "default-user";

async function getProgress() {
  const [subjects, articleProgress, quizProgress] = await Promise.all([
    prisma.subject.findMany({
      include: {
        articles: {
          include: {
            quizzes: true,
          },
        },
      },
      orderBy: { order: "asc" },
    }),
    prisma.userProgress.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        targetType: "ARTICLE",
      },
    }),
    prisma.userProgress.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        targetType: "QUIZ",
      },
    }),
  ]);

  const articleProgressMap = new Map(articleProgress.map((p) => [p.targetId, p]));
  const quizProgressMap = new Map(quizProgress.map((p) => [p.targetId, p]));

  const subjectStats = subjects.map((subject) => {
    const totalArticles = subject.articles.length;
    const completedArticles = subject.articles.filter(
      (a) => articleProgressMap.get(a.id)?.status === "COMPLETED"
    ).length;

    const totalQuizzes = subject.articles.reduce((acc, a) => acc + a.quizzes.length, 0);
    const correctQuizzes = subject.articles.reduce((acc, a) => {
      return acc + a.quizzes.filter((q) => quizProgressMap.get(q.id)?.status === "COMPLETED").length;
    }, 0);

    return {
      ...subject,
      totalArticles,
      completedArticles,
      totalQuizzes,
      correctQuizzes,
    };
  });

  const reviewQuizzes = await prisma.userProgress.findMany({
    where: {
      userId: DEFAULT_USER_ID,
      targetType: "QUIZ",
      OR: [
        { status: "IN_PROGRESS" },
        {
          status: "COMPLETED",
          score: { lt: 100 },
        },
      ],
    },
    orderBy: { lastAccessedAt: "asc" },
    take: 5,
  });

  return { subjectStats, reviewQuizzes };
}

export default async function Home() {
  const { subjectStats, reviewQuizzes } = await getProgress();

  const totalArticles = subjectStats.reduce((acc, s) => acc + s.totalArticles, 0);
  const completedArticles = subjectStats.reduce((acc, s) => acc + s.completedArticles, 0);
  const totalQuizzes = subjectStats.reduce((acc, s) => acc + s.totalQuizzes, 0);
  const correctQuizzes = subjectStats.reduce((acc, s) => acc + s.correctQuizzes, 0);

  const articleProgressPercent = totalArticles > 0 ? (completedArticles / totalArticles) * 100 : 0;
  const quizProgressPercent = totalQuizzes > 0 ? (correctQuizzes / totalQuizzes) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            中小企業診断士 学習サイト
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
            無料で学べる中小企業診断士試験対策プラットフォーム。
            7科目の体系的な学習コンテンツで、効率的に試験対策を進められます。
          </p>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            学習を始める
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-success/10 blur-2xl" />
      </div>

      {/* Progress Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="group hover:shadow-md hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">記事学習進捗</CardTitle>
              <CardDescription>
                {completedArticles} / {totalArticles} 記事完了
              </CardDescription>
            </div>
            <div className="text-2xl font-bold text-primary">
              {Math.round(articleProgressPercent)}%
            </div>
          </CardHeader>
          <CardContent>
            <Progress
              value={articleProgressPercent}
              variant={articleProgressPercent >= 80 ? "success" : "default"}
            />
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 text-success">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">クイズ正答率</CardTitle>
              <CardDescription>
                {correctQuizzes} / {totalQuizzes} 正解
              </CardDescription>
            </div>
            <div className="text-2xl font-bold text-success">
              {Math.round(quizProgressPercent)}%
            </div>
          </CardHeader>
          <CardContent>
            <Progress
              value={quizProgressPercent}
              variant="success"
            />
          </CardContent>
        </Card>
      </div>

      {reviewQuizzes.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/20 text-warning-foreground">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">復習が必要なクイズ</CardTitle>
              <CardDescription>間違えた問題や未完了の問題</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reviewQuizzes.map((progress) => (
                <li key={progress.id} className="flex items-center justify-between p-3 rounded-lg bg-background border hover:border-primary/30 transition-colors">
                  <Link
                    href={`/quiz?quizId=${progress.targetId}`}
                    className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    クイズ #{progress.targetId.slice(-6)}
                  </Link>
                  <Badge variant={progress.status === "IN_PROGRESS" ? "warning" : "outline"}>
                    {progress.status === "IN_PROGRESS" ? "未完了" : `${progress.score}%`}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">科目別進捗</CardTitle>
          <Link
            href="/subjects"
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            すべて見る
            <ChevronRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {subjectStats.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                科目がまだ登録されていません。
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium mt-2 transition-colors"
              >
                管理画面から追加
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {subjectStats.map((subject) => {
                const progress = subject.totalArticles > 0
                  ? (subject.completedArticles / subject.totalArticles) * 100
                  : 0;
                return (
                  <Link
                    key={subject.id}
                    href={`/subjects/${subject.id}`}
                    className="block p-4 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium group-hover:text-primary transition-colors">
                        {subject.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {subject.completedArticles}/{subject.totalArticles} 記事
                        </span>
                        <Badge variant={progress === 100 ? "success" : progress > 0 ? "warning" : "secondary"}>
                          {Math.round(progress)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress
                      value={progress}
                      size="sm"
                      variant={progress === 100 ? "success" : "default"}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
