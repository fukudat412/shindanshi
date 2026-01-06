import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { getBookmarks } from "@/lib/bookmark-actions";
import { BookmarkButton } from "@/components/bookmark-button";
import { Bookmark, FileText, HelpCircle, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/bookmarks");
  }

  const bookmarks = await getBookmarks();

  const articleBookmarks = bookmarks.filter((b) => b.targetType === "ARTICLE" && b.article);
  const quizBookmarks = bookmarks.filter((b) => b.targetType === "QUIZ" && b.quiz);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-yellow-100 text-yellow-600 shrink-0">
          <Bookmark className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">ブックマーク</h1>
          <p className="text-muted-foreground mt-1">
            お気に入りの記事・クイズ
          </p>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Bookmark className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-3">
              ブックマークがありません
            </p>
            <p className="text-sm text-muted-foreground">
              記事やクイズのブックマークアイコンをクリックして追加できます
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 記事ブックマーク */}
          {articleBookmarks.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">記事 ({articleBookmarks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {articleBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/articles/${bookmark.article!.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {bookmark.article!.title}
                      </Link>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {bookmark.article!.subject.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <BookmarkButton
                        targetType="ARTICLE"
                        targetId={bookmark.article!.id}
                        initialBookmarked={true}
                        variant="icon"
                      />
                      <Link href={`/articles/${bookmark.article!.id}`}>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* クイズブックマーク */}
          {quizBookmarks.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <HelpCircle className="w-5 h-5 text-warning-foreground" />
                <CardTitle className="text-lg">クイズ ({quizBookmarks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quizBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/quiz?quizId=${bookmark.quiz!.id}`}
                        className="font-medium hover:text-primary transition-colors line-clamp-2"
                      >
                        {bookmark.quiz!.question}
                      </Link>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {bookmark.quiz!.article.subject.name}
                        </Badge>
                        {bookmark.quiz!.topic && (
                          <Badge variant="default" className="text-xs bg-orange-500">
                            {bookmark.quiz!.topic.name}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {bookmark.quiz!.article.title}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <BookmarkButton
                        targetType="QUIZ"
                        targetId={bookmark.quiz!.id}
                        initialBookmarked={true}
                        variant="icon"
                      />
                      <Link href={`/quiz?quizId=${bookmark.quiz!.id}`}>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
