import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { MarkAsComplete } from "./mark-complete";
import { ChevronLeft, FileText, HelpCircle, Play, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

async function getArticle(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: {
      subject: true,
      quizzes: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href={`/subjects/${article.subjectId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {article.subject.name}に戻る
        </Link>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{article.title}</h1>
            <div className="flex gap-2 mt-3 flex-wrap">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <Card className="overflow-hidden">
        <CardContent className="prose prose-neutral dark:prose-invert max-w-none py-8 px-6 md:px-8 prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {article.bodyMd}
          </ReactMarkdown>
        </CardContent>
      </Card>

      {/* Mark Complete */}
      <MarkAsComplete articleId={article.id} />

      {/* Quiz Section */}
      {article.quizzes.length > 0 && (
        <Card className="bg-gradient-to-r from-success/5 to-transparent border-success/20">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 text-success">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">確認クイズ</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                この記事に関連するクイズが {article.quizzes.length} 問あります
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Link href={`/quiz?articleId=${article.id}`}>
              <Button className="gap-2">
                <Play className="w-4 h-4" />
                クイズを開始
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Link href={`/subjects/${article.subjectId}`}>
          <Button variant="outline" className="gap-2">
            <BookOpen className="w-4 h-4" />
            科目一覧に戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
