import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { MockExamClient } from "./mock-exam-client";
import { ChevronLeft, ClipboardCheck, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

async function getInProgressExam(userId: string) {
  return prisma.mockExam.findFirst({
    where: {
      userId,
      status: { in: ["IN_PROGRESS", "PAUSED"] },
    },
    orderBy: { startedAt: "desc" },
  });
}

async function getRecentExams(userId: string) {
  return prisma.mockExam.findMany({
    where: {
      userId,
      status: "COMPLETED",
    },
    orderBy: { completedAt: "desc" },
    take: 5,
  });
}

export default async function MockExamPage() {
  const session = await auth();
  const userId = session?.user?.id ?? (await getOrCreateGuestUser());
  const subjects = await getSubjects();
  const inProgressExam = await getInProgressExam(userId);
  const recentExams = await getRecentExams(userId);

  const subjectsWithQuizCount = subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    quizCount: subject.articles.reduce(
      (acc, article) => acc + article._count.quizzes,
      0
    ),
  }));

  // 科目名のマップを作成
  const subjectNameMap = new Map(subjects.map((s) => [s.id, s.name]));

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
            <ClipboardCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">模擬試験</h1>
            <p className="text-muted-foreground mt-1">
              本番形式で実力を測定します
            </p>
          </div>
        </div>
      </div>

      {/* 進行中の試験がある場合 */}
      {inProgressExam && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              進行中の試験があります
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm">
                  {inProgressExam.title ||
                    inProgressExam.subjectIds
                      .map((id) => subjectNameMap.get(id))
                      .join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {inProgressExam.questionCount}問 / 制限時間{" "}
                  {inProgressExam.timeLimit}分
                </p>
                <Badge
                  variant={
                    inProgressExam.status === "PAUSED" ? "warning" : "default"
                  }
                >
                  {inProgressExam.status === "PAUSED" ? "一時停止中" : "実行中"}
                </Badge>
              </div>
              <Link href={`/mock-exam/${inProgressExam.id}`}>
                <Button>
                  {inProgressExam.status === "PAUSED" ? "再開する" : "続ける"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 設定画面 */}
      <MockExamClient subjects={subjectsWithQuizCount} />

      {/* 最近の試験履歴 */}
      {recentExams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              最近の試験結果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentExams.map((exam) => {
              const scorePercent = exam.score
                ? Math.round((exam.score / exam.questionCount) * 100)
                : 0;
              return (
                <Link
                  key={exam.id}
                  href={`/mock-exam/${exam.id}/result`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {exam.title ||
                        exam.subjectIds
                          .map((id) => subjectNameMap.get(id))
                          .join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exam.completedAt?.toLocaleDateString("ja-JP")} ・{" "}
                      {exam.questionCount}問
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-lg font-bold ${
                        scorePercent >= 80
                          ? "text-success"
                          : scorePercent >= 60
                            ? "text-primary"
                            : "text-destructive"
                      }`}
                    >
                      {scorePercent}%
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {exam.score}/{exam.questionCount}問正解
                    </p>
                  </div>
                </Link>
              );
            })}
            <Link href="/mock-exam/history" className="block">
              <Button variant="outline" className="w-full mt-2">
                すべての履歴を見る
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
