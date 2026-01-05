import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { BookOpen, ChevronRight, FolderOpen } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSubjects() {
  return prisma.subject.findMany({
    include: {
      _count: {
        select: { articles: true },
      },
    },
    orderBy: { order: "asc" },
  });
}

export default async function SubjectsPage() {
  const subjects = await getSubjects();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">科目一覧</h1>
        <p className="text-muted-foreground mt-2">
          中小企業診断士試験の各科目を体系的に学習できます
        </p>
      </div>

      {subjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-3">
              科目がまだ登録されていません。
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              管理画面から追加
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, index) => (
            <Link key={subject.id} href={`/subjects/${subject.id}`}>
              <Card className="group hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 h-full">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      科目 {index + 1}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {subject.name}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="font-normal">
                        {subject._count.articles} 記事
                      </Badge>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    学習を始める
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
