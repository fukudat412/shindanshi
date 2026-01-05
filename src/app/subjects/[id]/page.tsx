import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, FileText, HelpCircle, CheckCircle, Clock, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

const DEFAULT_USER_ID = "default-user";

async function getSubject(id: string) {
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      articles: {
        include: {
          _count: { select: { quizzes: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!subject) return null;

  const progress = await prisma.userProgress.findMany({
    where: {
      userId: DEFAULT_USER_ID,
      targetType: "ARTICLE",
      targetId: { in: subject.articles.map((a) => a.id) },
    },
  });

  const progressMap = new Map(progress.map((p) => [p.targetId, p]));

  return {
    ...subject,
    articles: subject.articles.map((article) => ({
      ...article,
      progress: progressMap.get(article.id),
    })),
  };
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subject = await getSubject(id);

  if (!subject) {
    notFound();
  }

  const completedCount = subject.articles.filter((a) => a.progress?.status === "COMPLETED").length;
  const progressPercent = subject.articles.length > 0
    ? (completedCount / subject.articles.length) * 100
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          科目一覧に戻る
        </Link>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{subject.name}</h1>
            <p className="text-muted-foreground mt-1">
              {subject.articles.length} 記事
            </p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {subject.articles.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">学習進捗</span>
              <span className="text-sm text-muted-foreground">
                {completedCount} / {subject.articles.length} 完了
              </span>
            </div>
            <Progress
              value={progressPercent}
              variant={progressPercent === 100 ? "success" : "default"}
            />
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      {subject.articles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              この科目にはまだ記事がありません。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subject.articles.map((article, index) => (
            <Link key={article.id} href={`/articles/${article.id}`}>
              <Card className="group hover:shadow-md hover:border-primary/30 transition-all duration-300">
                <CardHeader className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="mt-1.5 flex gap-2 flex-wrap">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {article._count.quizzes > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <HelpCircle className="w-3 h-3 mr-1" />
                            {article._count.quizzes} 問
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="shrink-0">
                      {article.progress?.status === "COMPLETED" && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          完了
                        </Badge>
                      )}
                      {article.progress?.status === "IN_PROGRESS" && (
                        <Badge variant="warning" className="gap-1">
                          <Clock className="w-3 h-3" />
                          学習中
                        </Badge>
                      )}
                      {!article.progress && (
                        <Badge variant="secondary" className="text-xs">
                          未着手
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
