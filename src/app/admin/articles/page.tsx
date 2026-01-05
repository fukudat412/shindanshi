import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "./article-form";
import { DeleteArticleButton } from "./delete-button";
import { ChevronLeft, FileText, Plus, HelpCircle, Eye, X } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSubjects() {
  return prisma.subject.findMany({
    orderBy: { order: "asc" },
  });
}

async function getArticles(subjectId?: string) {
  return prisma.article.findMany({
    where: subjectId ? { subjectId } : undefined,
    include: {
      subject: true,
      _count: { select: { quizzes: true } },
    },
    orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
  });
}

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ subjectId?: string }>;
}) {
  const { subjectId } = await searchParams;
  const [subjects, articles] = await Promise.all([
    getSubjects(),
    getArticles(subjectId),
  ]);

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
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-success/10 text-success shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">記事管理</h1>
            <p className="text-muted-foreground mt-1">
              記事の追加・編集・削除
            </p>
          </div>
        </div>
      </div>

      {subjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-3">
              先に科目を作成してください。
            </p>
            <Link href="/admin/subjects">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                科目を作成
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <CardTitle>新規記事を追加</CardTitle>
            </CardHeader>
            <CardContent>
              <ArticleForm subjects={subjects} defaultSubjectId={subjectId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>記事一覧</CardTitle>
                {subjectId && (
                  <Link
                    href="/admin/articles"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    フィルタ解除
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {articles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">記事がまだ登録されていません。</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{article.title}</div>
                        <div className="text-sm text-muted-foreground flex gap-2 items-center flex-wrap mt-1">
                          <Badge variant="outline" className="text-xs">
                            {article.subject.name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {article._count.quizzes} クイズ
                          </Badge>
                          {article.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link href={`/admin/quizzes?articleId=${article.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <HelpCircle className="w-4 h-4" />
                            クイズ
                          </Button>
                        </Link>
                        <Link href={`/articles/${article.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="w-4 h-4" />
                            プレビュー
                          </Button>
                        </Link>
                        <DeleteArticleButton id={article.id} title={article.title} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
