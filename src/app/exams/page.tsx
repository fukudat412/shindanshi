import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ClipboardList, Clock, ChevronRight, FolderOpen, Play, History } from "lucide-react";

export const dynamic = "force-dynamic";

const DEFAULT_USER_ID = "default-user";

async function getExams() {
  const exams = await prisma.exam.findMany({
    include: {
      subject: true,
      _count: {
        select: { questions: true },
      },
    },
    orderBy: [
      { year: "desc" },
      { session: "asc" },
    ],
  });

  // ユーザーの受験履歴を取得
  const attempts = await prisma.examAttempt.findMany({
    where: {
      userId: DEFAULT_USER_ID,
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  const attemptMap = new Map<string, typeof attempts>();
  for (const attempt of attempts) {
    const existing = attemptMap.get(attempt.examId) || [];
    existing.push(attempt);
    attemptMap.set(attempt.examId, existing);
  }

  return { exams, attemptMap };
}

export default async function ExamsPage() {
  const { exams, attemptMap } = await getExams();

  // 年度別にグループ化
  const examsByYear = exams.reduce((acc, exam) => {
    if (!acc[exam.year]) {
      acc[exam.year] = [];
    }
    acc[exam.year].push(exam);
    return acc;
  }, {} as Record<number, typeof exams>);

  const years = Object.keys(examsByYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary shrink-0">
          <ClipboardList className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">過去問演習</h1>
          <p className="text-muted-foreground mt-1">
            年度・回別の過去問を本試験形式で演習できます
          </p>
        </div>
      </div>

      {exams.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-3">
              過去問がまだ登録されていません。
            </p>
            <Link
              href="/admin/exams"
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              管理画面から追加
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {years.map((year) => (
            <div key={year}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-lg">
                  {year}年度
                </span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {examsByYear[year].map((exam) => {
                  const userAttempts = attemptMap.get(exam.id) || [];
                  const inProgressAttempt = userAttempts.find(
                    (a) => a.status === "IN_PROGRESS" || a.status === "PAUSED"
                  );
                  const completedAttempts = userAttempts.filter(
                    (a) => a.status === "COMPLETED"
                  );
                  const bestScore = completedAttempts.length > 0
                    ? Math.max(...completedAttempts.map((a) => a.score || 0))
                    : null;

                  return (
                    <Card
                      key={exam.id}
                      className="group hover:shadow-md hover:border-primary/30 transition-all duration-300"
                    >
                      <CardHeader className="space-y-3">
                        <div className="flex items-start justify-between">
                          <Badge variant="outline" className="font-normal">
                            {exam.subject.name}
                          </Badge>
                          {inProgressAttempt && (
                            <Badge variant="warning">
                              中断中
                            </Badge>
                          )}
                          {bestScore !== null && !inProgressAttempt && (
                            <Badge variant={bestScore >= 60 ? "success" : "secondary"}>
                              最高 {bestScore}%
                            </Badge>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            第{exam.session}回
                          </CardTitle>
                          <CardDescription className="mt-2 space-y-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              制限時間: {exam.timeLimit}分
                            </div>
                            <div className="flex items-center gap-1">
                              <ClipboardList className="w-4 h-4" />
                              全{exam._count.questions}問
                            </div>
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {inProgressAttempt ? (
                          <Link href={`/exams/${exam.id}/take?attemptId=${inProgressAttempt.id}`}>
                            <Button className="w-full" variant="default">
                              <Play className="w-4 h-4" />
                              再開する
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/exams/${exam.id}/take`}>
                            <Button className="w-full" variant="default">
                              <Play className="w-4 h-4" />
                              試験を開始
                            </Button>
                          </Link>
                        )}
                        {completedAttempts.length > 0 && (
                          <Link href={`/exams/${exam.id}/history`}>
                            <Button className="w-full" variant="outline">
                              <History className="w-4 h-4" />
                              受験履歴 ({completedAttempts.length}回)
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
