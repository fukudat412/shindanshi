"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Pause,
  CheckCircle,
  AlertCircle,
  Flag,
} from "lucide-react";
import { saveAnswer, pauseExam, finishExam } from "../actions";

type Question = {
  id: string;
  order: number;
  question: string;
  quizType: string;
  choices: string[];
  answer: string;
  explanation: string | null;
};

type Props = {
  exam: {
    id: string;
    name: string;
    subject: string;
    timeLimit: number;
  };
  attemptId: string;
  remainingTime: number;
  questions: Question[];
  initialAnswers: Record<string, string>;
};

export default function ExamTakeClient({
  exam,
  attemptId,
  remainingTime: initialRemainingTime,
  questions,
  initialAnswers,
}: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [remainingTime, setRemainingTime] = useState(initialRemainingTime);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;

  // タイマー
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = useCallback(
    async (value: string) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
      // サーバーに保存（非同期）
      await saveAnswer(attemptId, currentQuestion.id, value);
    },
    [attemptId, currentQuestion.id]
  );

  const handlePause = async () => {
    setIsSubmitting(true);
    try {
      await pauseExam(attemptId, remainingTime);
      router.push("/exams");
    } catch (error) {
      console.error("中断に失敗しました:", error);
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const result = await finishExam(attemptId);
      router.push(`/exams/${exam.id}/result?attemptId=${result.id}`);
    } catch (error) {
      console.error("採点に失敗しました:", error);
      setIsSubmitting(false);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  const isAnswered = (questionId: string) => {
    return !!answers[questionId];
  };

  const isTimeWarning = remainingTime < 300; // 5分未満で警告

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ヘッダー：タイマーと進捗 */}
      <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-semibold text-lg">{exam.name}</h1>
              <p className="text-sm text-muted-foreground">{exam.subject}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* タイマー */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isTimeWarning
                    ? "bg-destructive/10 text-destructive animate-pulse"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg font-bold">
                  {formatTime(remainingTime)}
                </span>
              </div>

              {/* 進捗 */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {answeredCount}/{questions.length}問回答
                </span>
                <div className="w-24">
                  <Progress value={progressPercent} size="sm" />
                </div>
              </div>

              {/* 操作ボタン */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePause}
                  disabled={isSubmitting}
                >
                  <Pause className="w-4 h-4" />
                  <span className="hidden sm:inline">中断</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowConfirmFinish(true)}
                  disabled={isSubmitting}
                >
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">終了</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* メインコンテンツ：問題 */}
          <div>
            <Card className="mb-4">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    問題 {currentQuestion.order}
                  </CardTitle>
                  <Badge variant="outline">
                    {currentQuestion.quizType === "TRUE_FALSE" && "正誤"}
                    {currentQuestion.quizType === "MULTIPLE_CHOICE" && "選択"}
                    {currentQuestion.quizType === "SHORT_TEXT" && "記述"}
                    {currentQuestion.quizType === "NUMBER" && "数値"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 問題文 */}
                <div className="text-lg leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.question}
                </div>

                {/* 回答入力 */}
                <div className="space-y-3">
                  {currentQuestion.quizType === "TRUE_FALSE" && (
                    <div className="flex gap-3">
                      <Button
                        variant={
                          answers[currentQuestion.id] === "true"
                            ? "default"
                            : "outline"
                        }
                        className="flex-1 h-14 text-lg"
                        onClick={() => handleAnswerChange("true")}
                      >
                        正しい
                      </Button>
                      <Button
                        variant={
                          answers[currentQuestion.id] === "false"
                            ? "default"
                            : "outline"
                        }
                        className="flex-1 h-14 text-lg"
                        onClick={() => handleAnswerChange("false")}
                      >
                        誤り
                      </Button>
                    </div>
                  )}

                  {currentQuestion.quizType === "MULTIPLE_CHOICE" && (
                    <div className="space-y-2">
                      {currentQuestion.choices.map((choice, index) => (
                        <Button
                          key={index}
                          variant={
                            answers[currentQuestion.id] === choice
                              ? "default"
                              : "outline"
                          }
                          className="w-full justify-start h-auto py-3 px-4 text-left"
                          onClick={() => handleAnswerChange(choice)}
                        >
                          <span className="font-semibold mr-3">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {choice}
                        </Button>
                      ))}
                    </div>
                  )}

                  {(currentQuestion.quizType === "SHORT_TEXT" ||
                    currentQuestion.quizType === "NUMBER") && (
                    <Input
                      type={
                        currentQuestion.quizType === "NUMBER" ? "number" : "text"
                      }
                      placeholder="回答を入力してください"
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      className="text-lg h-14"
                    />
                  )}
                </div>

                {/* ナビゲーションボタン */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={() => goToQuestion(currentIndex - 1)}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    前の問題
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => goToQuestion(currentIndex + 1)}
                    disabled={currentIndex === questions.length - 1}
                  >
                    次の問題
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* サイドバー：問題ナビゲーション */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">問題一覧</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, index) => (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(index)}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                        index === currentIndex
                          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                          : isAnswered(q.id)
                          ? "bg-success/20 text-success-foreground hover:bg-success/30"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {q.order}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-success/20" />
                    回答済み
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-muted" />
                    未回答
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 終了確認モーダル */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                試験を終了しますか？
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {answeredCount < questions.length && (
                  <span className="text-destructive font-medium">
                    未回答の問題が {questions.length - answeredCount} 件あります。
                  </span>
                )}
                {answeredCount === questions.length && (
                  <span className="text-success font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    全ての問題に回答済みです。
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                終了すると採点され、結果が表示されます。
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmFinish(false)}
                  disabled={isSubmitting}
                >
                  続ける
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "採点中..." : "終了して採点"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
