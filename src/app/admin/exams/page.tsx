import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { Plus, ClipboardList, Clock, Edit, Trash2, ChevronRight, Layers } from "lucide-react";
import { buildPastExamSets, deleteExam } from "./actions";

export const dynamic = "force-dynamic";

async function getExams() {
  return prisma.exam.findMany({
    include: {
      subject: true,
      _count: {
        select: { questions: true, attempts: true },
      },
    },
    orderBy: [
      { year: "desc" },
      { session: "asc" },
    ],
  });
}

export default async function AdminExamsPage() {
  const exams = await getExams();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-secondary/50 text-secondary-foreground shrink-0">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">過去問管理</h1>
            <p className="text-muted-foreground mt-1">
              過去問試験の作成と管理
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <form action={buildPastExamSets}>
            <Button variant="outline">
              <Layers className="w-4 h-4" />
              過去問から年度別セットを作る
            </Button>
          </form>
          <Link href="/admin/exams/new">
            <Button>
              <Plus className="w-4 h-4" />
              新規作成
            </Button>
          </Link>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        「過去問から年度別セットを作る」は、取り込んだ過去問を年度・科目ごとに問題番号順でまとめ、本番と同じ試験時間（60 分または 90 分）のセットにします。同じ年度・科目の第 1 回のセットがあれば、問題を入れ直します（受験の途中のものは、出題される問題が入れ直したあとのものに変わります）。
      </p>

      {exams.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-3">
              過去問がまだ登録されていません。
            </p>
            <Link href="/admin/exams/new">
              <Button>
                <Plus className="w-4 h-4" />
                最初の過去問を作成
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{exam.name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-3 flex-wrap">
                      <Badge variant="outline">{exam.subject.name}</Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exam.timeLimit}分
                      </span>
                      <span>{exam._count.questions}問</span>
                      <span className="text-xs">受験{exam._count.attempts}回</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/exams/${exam.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                        編集
                      </Button>
                    </Link>
                    <form action={deleteExam.bind(null, exam.id)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href={`/admin/exams/${exam.id}`}
                  className="flex items-center text-sm text-primary font-medium hover:underline"
                >
                  問題を管理
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
