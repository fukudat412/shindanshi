import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  Home,
  RefreshCw,
  BarChart3,
  Target,
  Lightbulb,
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

export default async function ResultPage({
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

  // 科目名マップ
  const subjects = await prisma.subject.findMany({
    where: { id: { in: exam.subjectIds } },
  });
  const subjectNameMap = new Map(subjects.map((s) => [s.id, s.name]));

  // 科目別の統計を計算
  const subjectStats = new Map<
    string,
    { name: string; correct: number; total: number; timeSpent: number }
  >();

  exam.answers.forEach((answer) => {
    const quiz = quizMap.get(answer.quizId);
    if (!quiz) return;

    const subjectId = quiz.article.subjectId;
    const existing = subjectStats.get(subjectId) || {
      name: quiz.article.subject.name,
      correct: 0,
      total: 0,
      timeSpent: 0,
    };

    existing.total++;
    if (answer.isCorrect) existing.correct++;
    existing.timeSpent += answer.timeSpent;

    subjectStats.set(subjectId, existing);
  });

  // 全体統計
  const totalQuestions = exam.questionCount;
  const correctCount = exam.score || 0;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  // 合計時間
  const totalTimeSpent = exam.answers.reduce((sum, a) => sum + a.timeSpent, 0);
  const avgTimePerQuestion = Math.round(totalTimeSpent / totalQuestions);

  // 実際にかかった時間（開始から完了まで）
  const examDuration = exam.completedAt
    ? Math.floor(
        (exam.completedAt.getTime() - exam.startedAt.getTime()) / 1000
      ) - exam.pausedDuration
    : 0;

  // 過去の同条件の試験を取得（比較用）
  const previousExams = await prisma.mockExam.findMany({
    where: {
      userId,
      status: "COMPLETED",
      id: { not: exam.id },
      subjectIds: { equals: exam.subjectIds },
    },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  const previousAvgScore =
    previousExams.length > 0
      ? Math.round(
          previousExams.reduce(
            (sum, e) => sum + ((e.score || 0) / e.questionCount) * 100,
            0
          ) / previousExams.length
        )
      : null;

  const isPerfect = scorePercent === 100;
  const isGood = scorePercent >= 80;
  const isPassed = scorePercent >= 60;
  const isAbandoned = exam.status === "ABANDONED";

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
      </div>

      {/* スコアカード */}
      <Card className="overflow-hidden">
        <div
          className={`py-8 px-6 text-center ${
            isAbandoned
              ? "bg-muted"
              : isPerfect
                ? "bg-gradient-to-br from-success/10 to-success/5"
                : isGood
                  ? "bg-gradient-to-br from-primary/10 to-primary/5"
                  : isPassed
                    ? "bg-gradient-to-br from-warning/10 to-warning/5"
                    : "bg-gradient-to-br from-destructive/10 to-destructive/5"
          }`}
        >
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              isAbandoned
                ? "bg-muted-foreground/20 text-muted-foreground"
                : isPerfect
                  ? "bg-success/20 text-success"
                  : isGood
                    ? "bg-primary/20 text-primary"
                    : isPassed
                      ? "bg-warning/20 text-warning-foreground"
                      : "bg-destructive/20 text-destructive"
            }`}
          >
            <Trophy className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl mb-2">
            {isAbandoned
              ? "試験放棄"
              : exam.title ||
                exam.subjectIds.map((id) => subjectNameMap.get(id)).join(", ")}
          </CardTitle>
          {!isAbandoned && (
            <>
              <div
                className={`text-5xl font-bold mb-1 ${
                  isPerfect
                    ? "text-success"
                    : isGood
                      ? "text-primary"
                      : isPassed
                        ? "text-warning-foreground"
                        : "text-destructive"
                }`}
              >
                {scorePercent}%
              </div>
              <p className="text-muted-foreground">
                {correctCount} / {totalQuestions} 問正解
              </p>
              <div className="flex justify-center gap-2 mt-3">
                {isPerfect && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    パーフェクト！
                  </Badge>
                )}
                {isPassed && !isPerfect && (
                  <Badge
                    variant={isGood ? "default" : "warning"}
                    className="gap-1"
                  >
                    <Target className="w-3 h-3" />
                    合格ライン突破
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
        <CardContent className="p-6 space-y-6">
          {/* 時間統計 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {Math.floor(examDuration / 60)}:{(examDuration % 60)
                  .toString()
                  .padStart(2, "0")}
              </p>
              <p className="text-xs text-muted-foreground">所要時間</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Target className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{avgTimePerQuestion}秒</p>
              <p className="text-xs text-muted-foreground">平均回答時間</p>
            </div>
          </div>

          {/* 過去との比較 */}
          {previousAvgScore !== null && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="font-medium">過去の成績との比較</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  過去{previousExams.length}回の平均
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{previousAvgScore}%</span>
                  {scorePercent > previousAvgScore && (
                    <Badge variant="success" className="text-xs">
                      +{scorePercent - previousAvgScore}%
                    </Badge>
                  )}
                  {scorePercent < previousAvgScore && (
                    <Badge variant="destructive" className="text-xs">
                      {scorePercent - previousAvgScore}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 科目別分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            科目別分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from(subjectStats.entries()).map(([subjectId, stats]) => {
            const subjectPercent = Math.round(
              (stats.correct / stats.total) * 100
            );
            return (
              <div key={subjectId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{stats.name}</span>
                  <span
                    className={`font-bold ${
                      subjectPercent >= 80
                        ? "text-success"
                        : subjectPercent >= 60
                          ? "text-primary"
                          : "text-destructive"
                    }`}
                  >
                    {subjectPercent}%
                  </span>
                </div>
                <Progress
                  value={subjectPercent}
                  size="sm"
                  className={
                    subjectPercent >= 80
                      ? "[&>div]:bg-success"
                      : subjectPercent >= 60
                        ? ""
                        : "[&>div]:bg-destructive"
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {stats.correct} / {stats.total} 正解 ・ 平均{" "}
                  {Math.round(stats.timeSpent / stats.total)}秒/問
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 問題別詳細 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            問題別詳細
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {exam.answers.map((answer, index) => {
            const quiz = quizMap.get(answer.quizId);
            if (!quiz) return null;

            return (
              <div
                key={answer.id}
                className={`p-4 rounded-lg border ${
                  answer.isCorrect
                    ? "bg-success/5 border-success/20"
                    : answer.userAnswer
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-muted/50 border-muted"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    {answer.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : answer.userAnswer ? (
                      <XCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        問{index + 1}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {quiz.article.subject.name}
                      </Badge>
                    </div>
                    <p className="text-sm">{quiz.question}</p>
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-muted-foreground">正解: </span>
                        <span className="font-medium">
                          {quiz.quizType === "TRUE_FALSE"
                            ? quiz.answer === "true"
                              ? "○"
                              : "×"
                            : quiz.quizType === "MULTIPLE_CHOICE" &&
                                quiz.choices.length > 0
                              ? `${String.fromCharCode(65 + quiz.choices.indexOf(quiz.answer))}. ${quiz.answer}`
                              : quiz.answer}
                        </span>
                      </div>
                      {!answer.isCorrect && answer.userAnswer && (
                        <div>
                          <span className="text-muted-foreground">
                            あなたの回答:{" "}
                          </span>
                          <span className="font-medium text-destructive">
                            {quiz.quizType === "TRUE_FALSE"
                              ? answer.userAnswer === "true"
                                ? "○"
                                : "×"
                              : quiz.quizType === "MULTIPLE_CHOICE" &&
                                  quiz.choices.length > 0
                                ? `${String.fromCharCode(65 + quiz.choices.indexOf(answer.userAnswer))}. ${answer.userAnswer}`
                                : answer.userAnswer}
                          </span>
                        </div>
                      )}
                      {!answer.userAnswer && (
                        <span className="text-muted-foreground">未回答</span>
                      )}
                    </div>
                    {quiz.explanation && (
                      <div className="mt-2 p-3 bg-primary/5 rounded text-xs">
                        <span className="font-medium text-primary">解説: </span>
                        {quiz.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* アクション */}
      <div className="flex gap-3">
        <Link href="/mock-exam" className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <RefreshCw className="w-4 h-4" />
            もう一度受験
          </Button>
        </Link>
        <Link href="/" className="flex-1">
          <Button className="w-full gap-2">
            <Home className="w-4 h-4" />
            ホームへ
          </Button>
        </Link>
      </div>
    </div>
  );
}
