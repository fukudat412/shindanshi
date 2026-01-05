import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import {
  AlertTriangle,
  ChevronLeft,
  Play,
  TrendingUp,
  CheckCircle,
  Target,
} from "lucide-react";

export const dynamic = "force-dynamic";

const DEFAULT_USER_ID = "default-user";

async function getWeaknessData() {
  // 全てのクイズ進捗を取得
  const quizProgress = await prisma.userProgress.findMany({
    where: {
      userId: DEFAULT_USER_ID,
      targetType: "QUIZ",
    },
  });

  // 回答されたクイズのIDリスト
  const attemptedQuizIds = quizProgress
    .filter((p) => p.attemptCount > 0)
    .map((p) => p.targetId);

  if (attemptedQuizIds.length === 0) {
    return { weakSubjects: [], hasData: false };
  }

  // クイズ詳細を取得
  const quizzes = await prisma.quiz.findMany({
    where: { id: { in: attemptedQuizIds } },
    include: {
      article: { include: { subject: true } },
    },
  });

  // 科目別の統計を計算
  const subjectStats = new Map<
    string,
    {
      name: string;
      order: number;
      correct: number;
      total: number;
      weakQuizIds: string[];
    }
  >();

  for (const quiz of quizzes) {
    const progress = quizProgress.find((p) => p.targetId === quiz.id);
    const subject = quiz.article.subject;

    if (!subjectStats.has(subject.id)) {
      subjectStats.set(subject.id, {
        name: subject.name,
        order: subject.order,
        correct: 0,
        total: 0,
        weakQuizIds: [],
      });
    }

    const stats = subjectStats.get(subject.id)!;
    stats.total++;

    if (progress?.score === 100) {
      stats.correct++;
    } else {
      stats.weakQuizIds.push(quiz.id);
    }
  }

  // 正答率が低い順にソート
  const weakSubjects = Array.from(subjectStats.entries())
    .map(([id, stats]) => ({
      id,
      ...stats,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    }))
    .filter((s) => s.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy);

  return { weakSubjects, hasData: true };
}

export default async function WeaknessPage() {
  const { weakSubjects, hasData } = await getWeaknessData();

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
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-warning/10 text-warning-foreground shrink-0">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">弱点分析</h1>
            <p className="text-muted-foreground mt-1">
              苦手な科目を特定し、集中的に学習しましょう
            </p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              まだ学習データがありません。
              <br />
              クイズを解いて、弱点分析を始めましょう。
            </p>
            <Link href="/subjects">
              <Button className="gap-2">
                <Play className="w-4 h-4" />
                学習を始める
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {weakSubjects.map((subject, index) => {
            const isWeakest = index === 0 && subject.accuracy < 80;
            const isStrong = subject.accuracy >= 80;

            return (
              <Card
                key={subject.id}
                className={
                  isWeakest
                    ? "border-warning/50 bg-gradient-to-r from-warning/5 to-transparent"
                    : isStrong
                      ? "border-success/30 bg-gradient-to-r from-success/5 to-transparent"
                      : ""
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    {isWeakest && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-warning/20">
                        <AlertTriangle className="w-4 h-4 text-warning-foreground" />
                      </div>
                    )}
                    {isStrong && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/20">
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                    )}
                    {!isWeakest && !isStrong && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {subject.correct}/{subject.total} 正解 (
                        {Math.round(subject.accuracy)}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isWeakest && (
                      <Badge variant="warning" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        要強化
                      </Badge>
                    )}
                    {isStrong && (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        得意
                      </Badge>
                    )}
                    {subject.weakQuizIds.length > 0 && (
                      <Link
                        href={`/practice?subjectIds=${subject.id}&mode=weakness&count=${Math.min(subject.weakQuizIds.length, 10)}`}
                      >
                        <Button size="sm" variant="outline" className="gap-2">
                          <Play className="w-4 h-4" />
                          集中練習
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress
                    value={subject.accuracy}
                    variant={
                      subject.accuracy >= 80
                        ? "success"
                        : subject.accuracy >= 50
                          ? "default"
                          : "warning"
                    }
                  />
                  {subject.weakQuizIds.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      未習得の問題: {subject.weakQuizIds.length}問
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* 全体の苦手問題を練習 */}
          {weakSubjects.some((s) => s.weakQuizIds.length > 0) && (
            <Card className="border-primary/30">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">全科目の苦手問題を練習</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      すべての科目から間違えた問題をランダムに出題
                    </p>
                  </div>
                  <Link
                    href={`/practice?subjectIds=${weakSubjects.map((s) => s.id).join(",")}&mode=weakness&count=10`}
                  >
                    <Button className="gap-2">
                      <Play className="w-4 h-4" />
                      まとめて練習
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
