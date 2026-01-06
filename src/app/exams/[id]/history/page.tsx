import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Trophy,
} from "lucide-react";

export const dynamic = "force-dynamic";

const DEFAULT_USER_ID = "default-user";

type Props = {
  params: Promise<{ id: string }>;
};

async function getExamHistory(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: true,
      _count: {
        select: { questions: true },
      },
    },
  });

  if (!exam) {
    return null;
  }

  const attempts = await prisma.examAttempt.findMany({
    where: {
      examId,
      userId: DEFAULT_USER_ID,
      status: "COMPLETED",
    },
    orderBy: {
      finishedAt: "desc",
    },
  });

  return { exam, attempts };
}

export default async function ExamHistoryPage({ params }: Props) {
  const { id } = await params;
  const result = await getExamHistory(id);

  if (!result) {
    notFound();
  }

  const { exam, attempts } = result;

  // 統計計算
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => a.score || 0))
    : 0;
  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((acc, a) => acc + (a.score || 0), 0) / attempts.length)
    : 0;
  const passCount = attempts.filter((a) => (a.score || 0) >= 60).length;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return "-";
    const seconds = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  };

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex items-start gap-4">
        <Link href="/exams">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{exam.name}</h1>
          <p className="text-muted-foreground mt-1">
            {exam.subject.name} - 受験履歴
          </p>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="w-8 h-8 mx-auto text-primary mb-2" />
            <div className="text-3xl font-bold text-primary">{bestScore}%</div>
            <div className="text-sm text-muted-foreground">最高スコア</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{averageScore}%</div>
            <div className="text-sm text-muted-foreground">平均スコア</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{attempts.length}</div>
            <div className="text-sm text-muted-foreground">受験回数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-success">{passCount}</div>
            <div className="text-sm text-muted-foreground">合格回数</div>
          </CardContent>
        </Card>
      </div>

      {/* 受験履歴リスト */}
      <Card>
        <CardHeader>
          <CardTitle>受験履歴</CardTitle>
          <CardDescription>
            過去の受験結果を確認できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>まだ受験履歴がありません</p>
              <Link href={`/exams/${id}/take`}>
                <Button className="mt-4">試験を開始</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt, index) => {
                const isPassing = (attempt.score || 0) >= 60;
                const isBest = attempt.score === bestScore;

                return (
                  <Link
                    key={attempt.id}
                    href={`/exams/${id}/result?attemptId=${attempt.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isPassing
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {isPassing ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            第{attempts.length - index}回受験
                            {isBest && (
                              <Badge variant="warning" className="text-xs">
                                ベスト
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(attempt.finishedAt || attempt.startedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(attempt.startedAt, attempt.finishedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${
                              isPassing ? "text-success" : "text-destructive"
                            }`}
                          >
                            {attempt.score}%
                          </div>
                          <Badge variant={isPassing ? "success" : "outline"}>
                            {isPassing ? "合格" : "不合格"}
                          </Badge>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex gap-3">
        <Link href={`/exams/${id}/take`}>
          <Button>もう一度挑戦</Button>
        </Link>
        <Link href="/exams">
          <Button variant="outline">過去問一覧へ戻る</Button>
        </Link>
      </div>
    </div>
  );
}
