import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { updateExam, removeQuestionFromExam } from "../actions";
import AddQuestionDialog from "./AddQuestionDialog";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

async function getExam(id: string) {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      subject: true,
      questions: {
        include: {
          quiz: {
            include: {
              article: {
                include: { subject: true },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  return exam;
}

async function getSubjects() {
  return prisma.subject.findMany({
    orderBy: { order: "asc" },
  });
}

async function getAvailableQuizzes(examId: string, subjectId: string) {
  // 既に追加されている問題のIDを取得
  const existingQuizIds = await prisma.examQuestion.findMany({
    where: { examId },
    select: { quizId: true },
  });

  const excludeIds = existingQuizIds.map((q) => q.quizId);

  // まだ追加されていない問題を取得
  return prisma.quiz.findMany({
    where: {
      article: { subjectId },
      id: { notIn: excludeIds },
    },
    include: {
      article: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function EditExamPage({ params }: Props) {
  const { id } = await params;
  const exam = await getExam(id);

  if (!exam) {
    notFound();
  }

  const subjects = await getSubjects();
  const availableQuizzes = await getAvailableQuizzes(id, exam.subjectId);

  const updateExamWithId = updateExam.bind(null, id);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/exams">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">過去問を編集</h1>
          <p className="text-muted-foreground mt-1">{exam.name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 試験情報 */}
        <Card>
          <CardHeader>
            <CardTitle>試験情報</CardTitle>
            <CardDescription>
              過去問の基本情報を編集します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateExamWithId} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">試験名</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={exam.name}
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
                    defaultValue={exam.year}
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
                    defaultValue={exam.session}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectId">科目</Label>
                <select
                  id="subjectId"
                  name="subjectId"
                  defaultValue={exam.subjectId}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
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
                  defaultValue={exam.timeLimit}
                  required
                />
              </div>

              <Button type="submit">保存</Button>
            </form>
          </CardContent>
        </Card>

        {/* 問題リスト */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>問題一覧</CardTitle>
              <CardDescription>
                {exam.questions.length}問 登録済み
              </CardDescription>
            </div>
            <AddQuestionDialog
              examId={id}
              availableQuizzes={availableQuizzes.map((q) => ({
                id: q.id,
                question: q.question,
                quizType: q.quizType,
                articleTitle: q.article.title,
              }))}
            />
          </CardHeader>
          <CardContent>
            {exam.questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-3">問題がまだ追加されていません</p>
                <p className="text-sm">右上のボタンから問題を追加してください</p>
              </div>
            ) : (
              <div className="space-y-2">
                {exam.questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground w-8">
                      {question.order}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{question.quiz.question}</p>
                      <p className="text-xs text-muted-foreground">
                        {question.quiz.article.title}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {question.quiz.quizType === "TRUE_FALSE" && "正誤"}
                      {question.quiz.quizType === "MULTIPLE_CHOICE" && "選択"}
                      {question.quiz.quizType === "SHORT_TEXT" && "記述"}
                      {question.quiz.quizType === "NUMBER" && "数値"}
                    </Badge>
                    <form action={removeQuestionFromExam.bind(null, id, question.quizId)}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
