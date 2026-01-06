import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { QuizForm } from "./quiz-form";
import { DeleteQuizButton } from "./delete-button";
import { ChevronLeft, HelpCircle, Plus, FileText, X, Wand2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function getArticles() {
  return prisma.article.findMany({
    include: { subject: { select: { id: true, name: true } } },
    orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
  });
}

async function getTopics() {
  return prisma.topic.findMany({
    orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
  });
}

async function getQuizzes(articleId?: string) {
  return prisma.quiz.findMany({
    where: articleId ? { articleId } : undefined,
    include: {
      article: {
        include: { subject: true },
      },
      topic: true,
    },
    orderBy: [{ article: { order: "asc" } }, { order: "asc" }],
  });
}

export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ articleId?: string }>;
}) {
  const { articleId } = await searchParams;
  const [articles, topics, quizzes] = await Promise.all([
    getArticles(),
    getTopics(),
    getQuizzes(articleId),
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
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-warning/10 text-warning-foreground shrink-0">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">クイズ管理</h1>
            <p className="text-muted-foreground mt-1">
              クイズの追加・編集・削除
            </p>
          </div>
        </div>
      </div>

      {articles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-3">
              先に記事を作成してください。
            </p>
            <Link href="/admin/articles">
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                記事を作成
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <CardTitle>新規クイズを追加</CardTitle>
              </div>
              <Link href="/admin/generate">
                <Button variant="outline" size="sm" className="gap-1">
                  <Wand2 className="w-4 h-4" />
                  一括生成
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <QuizForm articles={articles} topics={topics} defaultArticleId={articleId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>クイズ一覧</CardTitle>
                {articleId && (
                  <Link
                    href="/admin/quizzes"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    フィルタ解除
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {quizzes.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">クイズがまだ登録されていません。</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{quiz.question}</div>
                        <div className="text-sm text-muted-foreground flex gap-2 items-center flex-wrap mt-1">
                          <Badge variant="outline" className="text-xs">
                            {quiz.article.subject.name}
                          </Badge>
                          {quiz.topic && (
                            <Badge variant="default" className="text-xs bg-orange-500">
                              {quiz.topic.name}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {quiz.article.title}
                          </Badge>
                          <Badge variant={
                            quiz.quizType === "TRUE_FALSE" ? "default" :
                            quiz.quizType === "MULTIPLE_CHOICE" ? "default" :
                            quiz.quizType === "SHORT_TEXT" ? "secondary" : "outline"
                          } className="text-xs">
                            {quiz.quizType === "TRUE_FALSE" && "○×"}
                            {quiz.quizType === "SHORT_TEXT" && "短文"}
                            {quiz.quizType === "NUMBER" && "数値"}
                            {quiz.quizType === "MULTIPLE_CHOICE" && "4択"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {quiz.phase === "INTRO" && "導入"}
                            {quiz.phase === "UNDERSTAND" && "理解"}
                            {quiz.phase === "RETAIN" && "定着"}
                            {quiz.phase === "EXAM" && "試験"}
                          </Badge>
                        </div>
                      </div>
                      <DeleteQuizButton id={quiz.id} />
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
