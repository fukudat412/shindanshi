import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { TopicForm } from "./topic-form";
import { DeleteTopicButton } from "./delete-button";
import { ChevronLeft, Tags, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

async function getTopics() {
  return prisma.topic.findMany({
    include: {
      subject: true,
      _count: { select: { quizzes: true, articles: true } },
    },
    orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
  });
}

async function getSubjects() {
  return prisma.subject.findMany({
    orderBy: { order: "asc" },
  });
}

export default async function AdminTopicsPage() {
  const [topics, subjects] = await Promise.all([getTopics(), getSubjects()]);

  // 科目ごとにグループ化
  const topicsBySubject = topics.reduce((acc, topic) => {
    const subjectName = topic.subject.name;
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(topic);
    return acc;
  }, {} as Record<string, typeof topics>);

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
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-orange-100 text-orange-600 shrink-0">
            <Tags className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">論点管理</h1>
            <p className="text-muted-foreground mt-1">
              論点（トピック）の追加・編集・削除
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          <CardTitle>新規論点を追加</CardTitle>
        </CardHeader>
        <CardContent>
          <TopicForm subjects={subjects} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>論点一覧（{topics.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <div className="text-center py-8">
              <Tags className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">論点がまだ登録されていません。</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(topicsBySubject).map(([subjectName, subjectTopics]) => (
                <div key={subjectName}>
                  <h3 className="font-semibold text-lg mb-3 text-primary">{subjectName}</h3>
                  <div className="space-y-2 ml-4">
                    {subjectTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 transition-colors"
                      >
                        <div>
                          <div className="font-medium">{topic.name}</div>
                          {topic.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {topic.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {topic._count.quizzes} クイズ
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {topic._count.articles} 記事
                            </Badge>
                          </div>
                        </div>
                        <DeleteTopicButton id={topic.id} name={topic.name} />
                      </div>
                    ))}
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
