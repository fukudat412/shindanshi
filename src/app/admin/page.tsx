import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { BookOpen, FileText, HelpCircle, Settings, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  const [subjects, articles, quizzes] = await Promise.all([
    prisma.subject.count(),
    prisma.article.count(),
    prisma.quiz.count(),
  ]);

  return { subjects, articles, quizzes };
}

export default async function AdminPage() {
  const stats = await getStats();

  const adminItems = [
    {
      title: "科目",
      description: `${stats.subjects} 件登録`,
      href: "/admin/subjects",
      icon: BookOpen,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "記事",
      description: `${stats.articles} 件登録`,
      href: "/admin/articles",
      icon: FileText,
      color: "bg-success/10 text-success",
    },
    {
      title: "クイズ",
      description: `${stats.quizzes} 件登録`,
      href: "/admin/quizzes",
      icon: HelpCircle,
      color: "bg-warning/10 text-warning-foreground",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-muted text-muted-foreground shrink-0">
          <Settings className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">管理画面</h1>
          <p className="text-muted-foreground mt-1">
            コンテンツの作成・編集
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {adminItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="group hover:shadow-md hover:border-primary/30 transition-all duration-300 h-full">
              <CardHeader className="space-y-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  管理する
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
