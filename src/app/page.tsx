import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user-utils";
import { getDueReviews } from "@/lib/due-review";
import { getStreakData } from "@/lib/streak-actions";
import { BookOpen, CheckCircle, HelpCircle, RefreshCw, ChevronRight, TrendingDown, Tags, Flame } from "lucide-react";

export const dynamic = "force-dynamic";

// ストリークマイルストーン
const STREAK_MILESTONE_WEEK = 7;
const STREAK_MILESTONE_MONTH = 30;

async function getProgress() {
  const userId = await getCurrentUserId();
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
        userId: userId,
        targetType: "ARTICLE",
      },
    }),
    prisma.userProgress.findMany({
      where: {
        userId: userId,
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

  // 復習が必要なクイズ（SM-2アルゴリズムに基づく。出題対象外は除く）
  const { dueQuizzes, dueCount } = await getDueReviews(userId);

  // topic単位の正答率ランキング（弱点分析）
  const topicStats = await prisma.$queryRaw<
    { topicId: string; topicName: string; subjectName: string; totalQuizzes: number; correctQuizzes: number; accuracy: number }[]
  >`
    SELECT
      t.id as "topicId",
      t.name as "topicName",
      s.name as "subjectName",
      COUNT(DISTINCT q.id)::int as "totalQuizzes",
      COUNT(DISTINCT CASE WHEN up.status = 'COMPLETED' THEN q.id END)::int as "correctQuizzes",
      -- ROUND は numeric（Prisma では Decimal）を返すので、int にして number で受け取る
      (CASE
        WHEN COUNT(DISTINCT q.id) > 0
        THEN ROUND((COUNT(DISTINCT CASE WHEN up.status = 'COMPLETED' THEN q.id END)::numeric / COUNT(DISTINCT q.id)::numeric) * 100)
        ELSE 0
      END)::int as "accuracy"
    FROM topics t
    JOIN subjects s ON t.subject_id = s.id
    JOIN quizzes q ON q.topic_id = t.id
    LEFT JOIN user_progress up ON up.target_id = q.id AND up.target_type = 'QUIZ' AND up.user_id = ${userId}
    GROUP BY t.id, t.name, s.name
    HAVING COUNT(DISTINCT q.id) > 0
    ORDER BY "accuracy" ASC, "totalQuizzes" DESC
    LIMIT 5
  `;

  return { subjectStats, dueQuizzes, dueCount, topicStats };
}

export default async function Home() {
  const [{ subjectStats, dueQuizzes, dueCount, topicStats }, streakData] = await Promise.all([
    getProgress(),
    getStreakData(),
  ]);

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

      {/* Streak Card */}
      {streakData.streak > 0 && (
        <Card className="bg-gradient-to-r from-warning/10 via-orange-500/5 to-transparent border-warning/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-warning/20">
                <Flame className="w-7 h-7 text-warning-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-warning-foreground">
                    {streakData.streak}
                  </span>
                  <span className="text-lg font-medium text-muted-foreground">日連続</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  今日 {streakData.todayCount} 問回答
                  {streakData.streak >= STREAK_MILESTONE_WEEK && " - 素晴らしい継続力！"}
                  {streakData.streak >= STREAK_MILESTONE_MONTH && " 🎉"}
                </p>
              </div>
              <Link
                href="/stats"
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
              >
                詳細
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

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

      <div className="flex justify-end">
        <Link
          href="/today"
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
        >
          今日のキューを始める
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {dueQuizzes.length > 0 && (
        <Card className="border-warning/30 bg-gradient-to-r from-warning/5 to-transparent">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/20 text-warning-foreground">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">今日の復習 5問</CardTitle>
              <CardDescription>
                間隔反復アルゴリズムに基づく復習推奨
                {dueCount > 5 && ` (あと${dueCount - 5}件)`}
              </CardDescription>
            </div>
            <Link
              href="/practice?mode=weakness"
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              まとめて復習
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {dueQuizzes.map((progress) => (
                <li key={progress.id} className="flex items-center justify-between p-3 rounded-lg bg-background border hover:border-primary/30 transition-colors">
                  <Link
                    href={`/quiz?quizId=${progress.targetId}`}
                    className="flex-1 min-w-0 mr-3"
                  >
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground hover:text-primary transition-colors truncate">
                        {progress.quiz?.question || `クイズ #${progress.targetId.slice(-6)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-6">
                      {progress.quiz?.topic && (
                        <Badge variant="outline" className="text-xs">
                          {progress.quiz.topic.name}
                        </Badge>
                      )}
                      {progress.quiz?.article && (
                        <span className="text-xs text-muted-foreground">
                          {progress.quiz.article.subject.name}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {progress.nextReviewAt && (
                      <span className="text-xs text-muted-foreground">
                        {progress.nextReviewAt < new Date() ? "期限切れ" : "今日復習"}
                      </span>
                    )}
                    <Badge variant={progress.status === "IN_PROGRESS" ? "warning" : "outline"}>
                      {progress.status === "IN_PROGRESS" ? "未習得" : `${progress.score}%`}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {topicStats.length > 0 && (
        <Card className="border-destructive/20 bg-gradient-to-r from-destructive/5 to-transparent">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 text-destructive">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">弱点論点ランキング</CardTitle>
              <CardDescription>
                正答率が低い論点を重点的に復習しましょう
              </CardDescription>
            </div>
            <Link
              href="/weakness"
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              詳細を見る
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {topicStats.map((topic, index) => (
                <li key={topic.topicId} className="flex items-center justify-between p-3 rounded-lg bg-background border hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? "bg-destructive/20 text-destructive" :
                      index === 1 ? "bg-orange-100 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Tags className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{topic.topicName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{topic.subjectName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {topic.correctQuizzes}/{topic.totalQuizzes} 正解
                    </span>
                    <Badge variant={
                      topic.accuracy >= 80 ? "success" :
                      topic.accuracy >= 50 ? "warning" : "destructive"
                    }>
                      {topic.accuracy}%
                    </Badge>
                  </div>
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
