import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { createExam } from "../actions";

export const dynamic = "force-dynamic";

async function getSubjects() {
  return prisma.subject.findMany({
    orderBy: { order: "asc" },
  });
}

export default async function NewExamPage() {
  const subjects = await getSubjects();

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/exams">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">過去問を作成</h1>
          <p className="text-muted-foreground mt-1">
            新しい過去問試験を作成します
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>試験情報</CardTitle>
          <CardDescription>
            過去問の基本情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createExam} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">試験名</Label>
              <Input
                id="name"
                name="name"
                placeholder="例: 令和5年度 第1回 中小企業診断士試験"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">年度</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  min="2000"
                  max="2100"
                  defaultValue={currentYear}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session">回数</Label>
                <Input
                  id="session"
                  name="session"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectId">科目</Label>
              <select
                id="subjectId"
                name="subjectId"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">科目を選択</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeLimit">制限時間（分）</Label>
              <Input
                id="timeLimit"
                name="timeLimit"
                type="number"
                min="1"
                max="300"
                defaultValue="60"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/admin/exams">
                <Button type="button" variant="outline">
                  キャンセル
                </Button>
              </Link>
              <Button type="submit">作成</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
