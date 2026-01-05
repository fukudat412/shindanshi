import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { SubjectForm } from "./subject-form";
import { DeleteSubjectButton } from "./delete-button";
import { ChevronLeft, BookOpen, Plus, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSubjects() {
  return prisma.subject.findMany({
    include: {
      _count: { select: { articles: true } },
    },
    orderBy: { order: "asc" },
  });
}

export default async function AdminSubjectsPage() {
  const subjects = await getSubjects();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          管理画面に戻る
        </Link>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">科目管理</h1>
            <p className="text-muted-foreground mt-1">
              科目の追加・編集・削除
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          <CardTitle>新規科目を追加</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>科目一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">科目がまだ登録されていません。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((subject, index) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{subject.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {subject._count.articles} 記事
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/articles?subjectId=${subject.id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <FileText className="w-4 h-4" />
                        記事を追加
                      </Button>
                    </Link>
                    <DeleteSubjectButton id={subject.id} name={subject.name} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
