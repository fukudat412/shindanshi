"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  saveExamAnswer,
  toggleMarkAnswer,
  pauseExam,
  resumeExam,
  submitExam,
  abandonExam,
} from "../actions";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Send,
  AlertTriangle,
  Home,
} from "lucide-react";

type Quiz = {
  id: string;
  question: string;
  quizType: "TRUE_FALSE" | "SHORT_TEXT" | "NUMBER" | "MULTIPLE_CHOICE";
  choices: string[];
  subjectName: string;
  userAnswer: string | null;
  isMarked: boolean;
  order: number;
};

type LocalAnswer = {
  userAnswer: string | null;
  isMarked: boolean;
  timeSpent: number;
};

export function ExamClient({
  examId,
  title,
  quizzes,
  initialRemainingSeconds,
  isPaused: initialIsPaused,
}: {
  examId: string;
  title: string;
  quizzes: Quiz[];
  initialRemainingSeconds: number;
  isPaused: boolean;
  timeLimit: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(
    initialRemainingSeconds
  );
  const [isPaused, setIsPaused] = useState(initialIsPaused);
  const [showNavigation, setShowNavigation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ローカルの回答状態を管理
  const [answers, setAnswers] = useState<Map<string, LocalAnswer>>(() => {
    const map = new Map();
    quizzes.forEach((q) => {
      map.set(q.id, {
        userAnswer: q.userAnswer,
        isMarked: q.isMarked,
        timeSpent: 0,
      });
    });
    return map;
  });

  // 問題ごとの滞在時間を追跡
  const questionStartTimeRef = useRef<number | null>(null);

  // 初期化
  useEffect(() => {
    if (questionStartTimeRef.current === null) {
      questionStartTimeRef.current = Date.now();
    }
  }, []);

  const currentQuiz = quizzes[currentIndex];
  const currentAnswer = answers.get(currentQuiz.id) || {
    userAnswer: null,
    isMarked: false,
    timeSpent: 0,
  };

  // 問題切り替え時に回答を保存
  const saveCurrentAnswer = useCallback(async () => {
    const startTime = questionStartTimeRef.current || Date.now();
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const answer = answers.get(currentQuiz.id);
    if (answer) {
      await saveExamAnswer(
        examId,
        currentQuiz.id,
        answer.userAnswer,
        answer.timeSpent + timeSpent
      );
    }
  }, [examId, currentQuiz.id, answers]);

  // handleSubmit用のrefを用意してメモリリークを防ぐ
  const handleSubmitRef = useRef<(() => Promise<void>) | null>(null);

  // 提出
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await saveCurrentAnswer();
    startTransition(async () => {
      await submitExam(examId);
    });
  }, [examId, saveCurrentAnswer, isSubmitting]);

  // refを最新の関数で更新
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  // タイマー（Date.nowベースで精度向上）
  useEffect(() => {
    if (isPaused || isSubmitting) return;

    const endTime = Date.now() + remainingSeconds * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        // 時間切れで自動提出
        clearInterval(timer);
        handleSubmitRef.current?.();
      }
    }, 200); // より頻繁にチェックして精度向上

    return () => clearInterval(timer);
  }, [isPaused, isSubmitting]); // remainingSecondsを除外して再実行を防ぐ

  // 回答の更新
  const updateAnswer = (userAnswer: string) => {
    setAnswers((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(currentQuiz.id) || {
        userAnswer: null,
        isMarked: false,
        timeSpent: 0,
      };
      newMap.set(currentQuiz.id, { ...existing, userAnswer });
      return newMap;
    });
  };

  // マーク切り替え
  const handleToggleMark = async () => {
    setAnswers((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(currentQuiz.id) || {
        userAnswer: null,
        isMarked: false,
        timeSpent: 0,
      };
      newMap.set(currentQuiz.id, { ...existing, isMarked: !existing.isMarked });
      return newMap;
    });
    await toggleMarkAnswer(examId, currentQuiz.id);
  };

  // 問題移動
  const goToQuestion = async (index: number) => {
    await saveCurrentAnswer();
    setCurrentIndex(index);
    questionStartTimeRef.current = Date.now();
    setShowNavigation(false);
  };

  // 一時停止/再開
  const handlePauseResume = async () => {
    if (isPaused) {
      await resumeExam(examId);
      setIsPaused(false);
    } else {
      await saveCurrentAnswer();
      await pauseExam(examId);
      setIsPaused(true);
    }
  };

  // 放棄
  const handleAbandon = async () => {
    startTransition(async () => {
      await abandonExam(examId);
    });
  };

  // 時間のフォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 統計
  const answeredCount = Array.from(answers.values()).filter(
    (a) => a.userAnswer
  ).length;
  const markedCount = Array.from(answers.values()).filter(
    (a) => a.isMarked
  ).length;
  const progressPercent = (answeredCount / quizzes.length) * 100;

  // 残り時間警告
  const isTimeWarning = remainingSeconds < 60;
  const isTimeCritical = remainingSeconds < 30;

  if (isPaused) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
              <Pause className="w-8 h-8 text-warning" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">試験を一時停止中</h2>
              <p className="text-muted-foreground">
                再開すると残り時間のカウントが始まります
              </p>
            </div>
            <div className="text-3xl font-mono font-bold">
              残り {formatTime(remainingSeconds)}
            </div>
            <div className="space-y-3">
              <Button
                onClick={handlePauseResume}
                className="w-full h-12 gap-2"
              >
                <Play className="w-5 h-5" />
                試験を再開
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Home className="w-4 h-4" />
                    試験を放棄
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>試験を放棄しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この操作は取り消せません。回答した内容は保存されません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleAbandon}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      放棄する
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ヘッダー */}
      <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                {title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {currentQuiz.subjectName}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* タイマー */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-lg font-bold ${
                  isTimeCritical
                    ? "bg-destructive/20 text-destructive animate-pulse"
                    : isTimeWarning
                      ? "bg-warning/20 text-warning-foreground"
                      : "bg-muted"
                }`}
              >
                <Clock className="w-4 h-4" />
                {formatTime(remainingSeconds)}
              </div>
              {/* 一時停止 */}
              <Button variant="outline" size="sm" onClick={handlePauseResume}>
                <Pause className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* 進捗バー */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>
                問題 {currentIndex + 1} / {quizzes.length}
              </span>
              <span>
                {answeredCount} / {quizzes.length} 回答済み
                {markedCount > 0 && (
                  <span className="ml-2">
                    <Flag className="inline w-3 h-3 mr-0.5" />
                    {markedCount}
                  </span>
                )}
              </span>
            </div>
            <Progress value={progressPercent} size="sm" />
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="mb-4">
          <CardContent className="p-6">
            {/* 問題 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">
                  {currentQuiz.quizType === "TRUE_FALSE" && "○×問題"}
                  {currentQuiz.quizType === "SHORT_TEXT" && "短文回答"}
                  {currentQuiz.quizType === "NUMBER" && "数値回答"}
                  {currentQuiz.quizType === "MULTIPLE_CHOICE" && "選択式問題"}
                </Badge>
                <Button
                  variant={currentAnswer.isMarked ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleMark}
                  className="gap-1"
                >
                  <Flag className="w-4 h-4" />
                  {currentAnswer.isMarked ? "マーク済み" : "後で見直す"}
                </Button>
              </div>
              <p className="text-lg leading-relaxed">{currentQuiz.question}</p>
            </div>

            {/* 回答入力 */}
            <div className="space-y-3">
              {currentQuiz.quizType === "TRUE_FALSE" ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={
                      currentAnswer.userAnswer === "true"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => updateAnswer("true")}
                    className={`h-14 text-base gap-2 ${
                      currentAnswer.userAnswer === "true"
                        ? ""
                        : "hover:border-primary/50"
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />○ 正しい
                  </Button>
                  <Button
                    variant={
                      currentAnswer.userAnswer === "false"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => updateAnswer("false")}
                    className={`h-14 text-base gap-2 ${
                      currentAnswer.userAnswer === "false"
                        ? ""
                        : "hover:border-primary/50"
                    }`}
                  >
                    <XCircle className="w-5 h-5" />× 誤り
                  </Button>
                </div>
              ) : currentQuiz.quizType === "MULTIPLE_CHOICE" &&
                currentQuiz.choices.length > 0 ? (
                <div className="space-y-2">
                  {currentQuiz.choices.map((choice, index) => (
                    <Button
                      key={index}
                      variant={
                        currentAnswer.userAnswer === choice
                          ? "default"
                          : "outline"
                      }
                      onClick={() => updateAnswer(choice)}
                      className={`w-full h-auto min-h-12 text-base justify-start px-4 py-3 text-left whitespace-normal ${
                        currentAnswer.userAnswer === choice
                          ? ""
                          : "hover:border-primary/50"
                      }`}
                    >
                      <span className="w-6 shrink-0 font-medium">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="flex-1">{choice}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <Input
                  type={currentQuiz.quizType === "NUMBER" ? "number" : "text"}
                  value={currentAnswer.userAnswer || ""}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={
                    currentQuiz.quizType === "NUMBER"
                      ? "数値を入力してください"
                      : "回答を入力してください"
                  }
                  className="h-12 text-base"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* ナビゲーション */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            前の問題
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowNavigation(!showNavigation)}
            className="gap-1"
          >
            問題一覧
          </Button>

          {currentIndex < quizzes.length - 1 ? (
            <Button
              onClick={() => goToQuestion(currentIndex + 1)}
              className="gap-1"
            >
              次の問題
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="gap-1" disabled={isPending}>
                  <Send className="w-4 h-4" />
                  提出する
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>試験を提出しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    {answeredCount < quizzes.length && (
                      <span className="text-warning flex items-center gap-1 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        未回答の問題が {quizzes.length - answeredCount}{" "}
                        問あります
                      </span>
                    )}
                    {markedCount > 0 && (
                      <span className="flex items-center gap-1 mb-2">
                        <Flag className="w-4 h-4" />
                        マーク中の問題が {markedCount} 問あります
                      </span>
                    )}
                    提出後は回答を変更できません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit}>
                    提出する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* 問題一覧（モーダル風） */}
        {showNavigation && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">問題一覧</h3>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {quizzes.map((quiz, index) => {
                  const answer = answers.get(quiz.id);
                  const isAnswered = !!answer?.userAnswer;
                  const isMarked = answer?.isMarked;
                  const isCurrent = index === currentIndex;

                  return (
                    <button
                      key={quiz.id}
                      onClick={() => goToQuestion(index)}
                      className={`relative w-full aspect-square rounded-lg flex items-center justify-center font-medium text-sm transition-colors ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isAnswered
                            ? "bg-success/20 text-success-foreground hover:bg-success/30"
                            : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {index + 1}
                      {isMarked && (
                        <Flag className="absolute -top-1 -right-1 w-3 h-3 text-warning" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-success/20" /> 回答済み
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-muted" /> 未回答
                </span>
                <span className="flex items-center gap-1">
                  <Flag className="w-3 h-3 text-warning" /> マーク
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
