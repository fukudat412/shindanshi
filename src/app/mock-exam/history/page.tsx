import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  History,
  Trophy,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
} from "lucide-react";

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

export default async function HistoryPage() {
  const session = await auth();
  const userId = session?.user?.id ?? (await getOrCreateGuestUser());

  const exams = await prisma.mockExam.findMany({
    where: {
      userId,
      status: { in: ["COMPLETED", "ABANDONED"] },
    },
    orderBy: { completedAt: "desc" },
  });

  // 科目名マップを作成
  const allSubjectIds = [...new Set(exams.flatMap((e) => e.subjectIds))];
  const subjects = await prisma.subject.findMany({
    where: { id: { in: allSubjectIds } },
  });
  const subjectNameMap = new Map(subjects.map((s) => [s.id, s.name]));

  // 統計計算
  const completedExams = exams.filter((e) => e.status === "COMPLETED");
  const totalExams = completedExams.length;
  const avgScore =
    totalExams > 0
      ? Math.round(
          completedExams.reduce(
            (sum, e) => sum + ((e.score || 0) / e.questionCount) * 100,
            0
          ) / totalExams
        )
      : 0;
  const bestScore =
    totalExams > 0
      ? Math.max(
          ...completedExams.map(
            (e) => Math.round(((e.score || 0) / e.questionCount) * 100)
          )
        )
      : 0;

  // 月別の試験回数を計算（最近6ヶ月）
  const monthlyStats = new Map<string, { count: number; avgScore: number }>();
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyStats.set(key, { count: 0, avgScore: 0 });
  }

  completedExams.forEach((exam) => {
    if (!exam.completedAt) return;
    const key = `${exam.completedAt.getFullYear()}-${String(exam.completedAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyStats.has(key)) {
      const current = monthlyStats.get(key)!;
      const newCount = current.count + 1;
      const examScore = ((exam.score || 0) / exam.questionCount) * 100;
      monthlyStats.set(key, {
        count: newCount,
        avgScore:
          (current.avgScore * current.count + examScore) / newCount,
      });
    }
  });

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/mock-exam"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          模擬試験に戻る
        </Link>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary shrink-0">
            <History className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">試験履歴</h1>
            <p className="text-muted-foreground mt-1">
              過去の模擬試験結果を確認
            </p>
          </div>
        </div>
      </div>

      {/* 全体統計 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{totalExams}</p>
            <p className="text-xs text-muted-foreground">受験回数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{avgScore}%</p>
            <p className="text-xs text-muted-foreground">平均スコア</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-success" />
            <p className="text-3xl font-bold">{bestScore}%</p>
            <p className="text-xs text-muted-foreground">最高スコア</p>
          </CardContent>
        </Card>
      </div>

      {/* 月別推移 */}
      {totalExams > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              月別推移（最近6ヶ月）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(monthlyStats.entries())
                .reverse()
                .map(([month, stats]) => {
                  const [year, monthNum] = month.split("-");
                  return (
                    <div
                      key={month}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">
                        {year}年{parseInt(monthNum)}月
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {stats.count}回
                        </span>
                        {stats.count > 0 && (
                          <Badge
                            variant={
                              stats.avgScore >= 80
                                ? "success"
                                : stats.avgScore >= 60
                                  ? "default"
                                  : "destructive"
                            }
                          >
                            平均 {Math.round(stats.avgScore)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 試験一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">すべての試験結果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {exams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>まだ試験履歴がありません</p>
              <Link href="/mock-exam" className="block mt-4">
                <Button>模擬試験を受ける</Button>
              </Link>
            </div>
          ) : (
            exams.map((exam, index) => {
              const scorePercent =
                exam.status === "COMPLETED" && exam.score !== null
                  ? Math.round((exam.score / exam.questionCount) * 100)
                  : null;

              // 前回との比較（同条件の試験）
              const prevExam = exams
                .slice(index + 1)
                .find(
                  (e) =>
                    e.status === "COMPLETED" &&
                    JSON.stringify(e.subjectIds.sort()) ===
                      JSON.stringify(exam.subjectIds.sort())
                );
              const prevScore =
                prevExam && prevExam.score !== null
                  ? Math.round((prevExam.score / prevExam.questionCount) * 100)
                  : null;
              const scoreDiff =
                scorePercent !== null && prevScore !== null
                  ? scorePercent - prevScore
                  : null;

              return (
                <Link
                  key={exam.id}
                  href={`/mock-exam/${exam.id}/result`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {exam.title ||
                          exam.subjectIds
                            .map((id) => subjectNameMap.get(id))
                            .join(", ")}
                      </p>
                      {exam.status === "ABANDONED" && (
                        <Badge variant="secondary">放棄</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {exam.completedAt?.toLocaleDateString("ja-JP")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exam.timeLimit}分
                      </span>
                      <span>{exam.questionCount}問</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {scorePercent !== null ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xl font-bold ${
                              scorePercent >= 80
                                ? "text-success"
                                : scorePercent >= 60
                                  ? "text-primary"
                                  : "text-destructive"
                            }`}
                          >
                            {scorePercent}%
                          </span>
                          {scoreDiff !== null && scoreDiff !== 0 && (
                            <span
                              className={`flex items-center text-xs ${
                                scoreDiff > 0
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            >
                              {scoreDiff > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {scoreDiff > 0 ? "+" : ""}
                              {scoreDiff}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {exam.score}/{exam.questionCount}問正解
                        </p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
