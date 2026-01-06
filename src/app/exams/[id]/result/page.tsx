import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string }>;
};

async function getResult(examId: string, attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          subject: true,
          questions: {
            include: { quiz: true },
            orderBy: { order: "asc" },
          },
        },
      },
      answers: {
        include: { quiz: true },
      },
    },
  });

  if (!attempt || attempt.examId !== examId || attempt.status !== "COMPLETED") {
    return null;
  }

  return attempt;
}

export default async function ExamResultPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { attemptId } = await searchParams;

  if (!attemptId) {
    notFound();
  }

  const attempt = await getResult(id, attemptId);

  if (!attempt) {
    notFound();
  }

  const totalQuestions = attempt.exam.questions.length;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const score = attempt.score || 0;
  const isPassing = score >= 60;

  // 解答時間を計算
  const startTime = new Date(attempt.startedAt).getTime();
  const endTime = attempt.finishedAt ? new Date(attempt.finishedAt).getTime() : startTime;
  const timeTaken = Math.floor((endTime - startTime) / 1000);
  const timeLimit = attempt.exam.timeLimit * 60;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}時間${m}分${s}秒`;
    }
    return `${m}分${s}秒`;
  };

  // 回答マップを作成
  const answerMap = new Map(attempt.answers.map((a) => [a.quizId, a]));

  return (
    <div className="space-y-8">
      {/* 結果サマリー */}
      <Card className={`border-2 ${isPassing ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}`}>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isPassing ? "bg-success/20" : "bg-destructive/20"}`}>
              <Trophy className={`w-10 h-10 ${isPassing ? "text-success" : "text-destructive"}`} />
            </div>
          </div>
          <CardTitle className="text-2xl">{attempt.exam.name}</CardTitle>
          <CardDescription>{attempt.exam.subject.name}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* スコア */}
          <div>
            <div className={`text-6xl font-bold ${isPassing ? "text-success" : "text-destructive"}`}>
              {score}%
            </div>
            <p className="text-muted-foreground mt-2">
              {correctCount} / {totalQuestions} 問正解
            </p>
          </div>

          {/* 合否判定 */}
          <Badge
            variant={isPassing ? "success" : "destructive"}
            className="text-lg px-6 py-2"
          >
            {isPassing ? "合格ライン達成" : "不合格"}
          </Badge>

          {/* 統計情報 */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-sm text-muted-foreground">解答時間</div>
              <div className="font-semibold">{formatTime(timeTaken)}</div>
              <div className="text-xs text-muted-foreground">
                制限時間: {formatTime(timeLimit)}
              </div>
            </div>
            <div className="text-center">
              <CheckCircle className="w-5 h-5 mx-auto text-success mb-1" />
              <div className="text-sm text-muted-foreground">正答率</div>
              <div className="font-semibold">{score}%</div>
              <div className="text-xs text-muted-foreground">
                合格ライン: 60%
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 justify-center pt-4">
            <Link href={`/exams/${id}/take`}>
              <Button variant="outline">
                <RotateCcw className="w-4 h-4" />
                もう一度挑戦
              </Button>
            </Link>
            <Link href="/exams">
              <Button variant="default">
                <Home className="w-4 h-4" />
                過去問一覧へ
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 問題別結果 */}
      <Card>
        <CardHeader>
          <CardTitle>問題別結果</CardTitle>
          <CardDescription>
            各問題の正誤と解説を確認できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attempt.exam.questions.map((question, index) => {
              const answer = answerMap.get(question.quizId);
              const isCorrect = answer?.isCorrect;
              const userAnswer = answer?.userAnswer;

              return (
                <details
                  key={question.id}
                  className="group border rounded-lg overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors list-none">
                    <div className="flex items-center gap-3">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-success shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive shrink-0" />
                      )}
                      <span className="font-medium">問題 {index + 1}</span>
                      <Badge variant="outline" className="font-normal">
                        {question.quiz.quizType === "TRUE_FALSE" && "正誤"}
                        {question.quiz.quizType === "MULTIPLE_CHOICE" && "選択"}
                        {question.quiz.quizType === "SHORT_TEXT" && "記述"}
                        {question.quiz.quizType === "NUMBER" && "数値"}
                      </Badge>
                    </div>
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-open:hidden" />
                    <ChevronUp className="w-5 h-5 text-muted-foreground hidden group-open:block" />
                  </summary>
                  <div className="p-4 pt-0 border-t bg-muted/30 space-y-4">
                    {/* 問題文 */}
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        問題
                      </div>
                      <p className="whitespace-pre-wrap">{question.quiz.question}</p>
                    </div>

                    {/* 選択肢（MULTIPLE_CHOICEの場合） */}
                    {question.quiz.quizType === "MULTIPLE_CHOICE" && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          選択肢
                        </div>
                        <div className="space-y-2">
                          {question.quiz.choices.map((choice, i) => {
                            const isUserChoice = userAnswer === choice;
                            const isCorrectChoice = question.quiz.answer === choice;
                            return (
                              <div
                                key={i}
                                className={`p-2 rounded-lg text-sm ${
                                  isCorrectChoice
                                    ? "bg-success/20 border border-success/50"
                                    : isUserChoice
                                    ? "bg-destructive/20 border border-destructive/50"
                                    : "bg-muted"
                                }`}
                              >
                                <span className="font-semibold mr-2">
                                  {String.fromCharCode(65 + i)}.
                                </span>
                                {choice}
                                {isCorrectChoice && (
                                  <Badge variant="success" className="ml-2 text-xs">
                                    正解
                                  </Badge>
                                )}
                                {isUserChoice && !isCorrectChoice && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    あなたの回答
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 回答比較（TRUE_FALSE, SHORT_TEXT, NUMBERの場合） */}
                    {question.quiz.quizType !== "MULTIPLE_CHOICE" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            あなたの回答
                          </div>
                          <div
                            className={`p-2 rounded-lg ${
                              isCorrect
                                ? "bg-success/20 border border-success/50"
                                : "bg-destructive/20 border border-destructive/50"
                            }`}
                          >
                            {userAnswer || "（未回答）"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            正解
                          </div>
                          <div className="p-2 rounded-lg bg-success/20 border border-success/50">
                            {question.quiz.answer}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 解説 */}
                    {question.quiz.explanation && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          解説
                        </div>
                        <p className="text-sm whitespace-pre-wrap bg-background p-3 rounded-lg border">
                          {question.quiz.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
