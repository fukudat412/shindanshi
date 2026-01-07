import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { getStreakData } from "@/lib/streak-actions";
import { ActivityChart } from "./components/activity-chart";
import {
  BarChart3,
  TrendingUp,
  Target,
  Flame,
  ChevronLeft,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const DEFAULT_USER_ID = "default-user";

async function getStatistics() {
  // 全ての進捗データを取得
  const allProgress = await prisma.userProgress.findMany({
    where: { userId: DEFAULT_USER_ID, targetType: "QUIZ" },
  });

  // 過去30日のDailyActivityを取得
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyActivities = await prisma.dailyActivity.findMany({
    where: {
      userId: DEFAULT_USER_ID,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: "asc" },
  });

  // 日別アクティビティをMap形式に変換
  const dailyActivity: [string, number][] = dailyActivities.map((a) => [
    a.date.toISOString().split("T")[0],
    a.quizCount,
  ]);

  // ストリークは共通ロジックを使用
  const streakData = await getStreakData(DEFAULT_USER_ID);

  // 総回答数と正答率
  const totalAttempts = allProgress.reduce(
    (acc, p) => acc + (p.attemptCount ?? 0),
    0
  );
  const correctAnswers = allProgress.filter((p) => p.score === 100).length;
  const overallAccuracy =
    allProgress.length > 0 ? (correctAnswers / allProgress.length) * 100 : 0;

  // 科目別統計
  const quizIds = allProgress.map((p) => p.targetId);
  const quizzes = await prisma.quiz.findMany({
    where: { id: { in: quizIds } },
    include: { article: { include: { subject: true } } },
  });

  const subjectStats = new Map<
    string,
    { name: string; correct: number; total: number; order: number }
  >();

  quizzes.forEach((quiz) => {
    const progress = allProgress.find((p) => p.targetId === quiz.id);
    const subject = quiz.article.subject;

    if (!subjectStats.has(subject.id)) {
      subjectStats.set(subject.id, {
        name: subject.name,
        correct: 0,
        total: 0,
        order: subject.order,
      });
    }

    const stats = subjectStats.get(subject.id)!;
    stats.total++;
    if (progress?.score === 100) stats.correct++;
  });

  // 科目順でソート
  const sortedSubjectStats = Array.from(subjectStats.entries())
    .map(([id, stats]) => ({
      id,
      ...stats,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    }))
    .sort((a, b) => a.order - b.order);

  return {
    dailyActivity,
    streak: streakData.streak,
    todayCount: streakData.todayCount,
    totalAttempts,
    overallAccuracy,
    totalQuizzes: allProgress.length,
    correctAnswers,
    subjectStats: sortedSubjectStats,
  };
}

export default async function StatsPage() {
  const stats = await getStatistics();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">学習統計</h1>
            <p className="text-muted-foreground mt-1">
              あなたの学習進捗を可視化します
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-warning/10 to-transparent border-warning/20">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/20">
              <Flame className="w-5 h-5 text-warning-foreground" />
            </div>
            <CardTitle className="text-sm font-medium">連続学習</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.streak} 日</div>
            <p className="text-xs text-muted-foreground mt-1">
              今日 {stats.todayCount} 問回答
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium">総回答数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAttempts}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/20">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/20">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <CardTitle className="text-sm font-medium">正答率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(stats.overallAccuracy)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
              <CheckCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-medium">解答済み問題</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.correctAnswers}
              <span className="text-lg text-muted-foreground font-normal">
                /{stats.totalQuizzes}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            学習アクティビティ（過去30日）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.dailyActivity.length > 0 ? (
            <ActivityChart data={stats.dailyActivity} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              まだ学習データがありません。クイズを解いてみましょう！
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subject Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            科目別正答率
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.subjectStats.length > 0 ? (
            stats.subjectStats.map((subject) => (
              <div key={subject.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{subject.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {subject.correct}/{subject.total} (
                    {Math.round(subject.accuracy)}%)
                  </span>
                </div>
                <Progress
                  value={subject.accuracy}
                  variant={subject.accuracy >= 80 ? "success" : "default"}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              まだ学習データがありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
