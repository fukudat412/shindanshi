"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { saveQuizResult } from "@/app/quiz/actions";
import {
  Shuffle,
  Play,
  CheckCircle,
  XCircle,
  RefreshCw,
  Home,
  Lightbulb,
  ChevronRight,
  Trophy,
  Target,
} from "lucide-react";

type Subject = {
  id: string;
  name: string;
  quizCount: number;
};

type Quiz = {
  id: string;
  question: string;
  quizType: "TRUE_FALSE" | "SHORT_TEXT" | "NUMBER" | "MULTIPLE_CHOICE";
  answer: string;
  choices?: string[];
  explanation: string | null;
  subjectName: string;
};

type QuizResult = {
  quizId: string;
  userAnswer: string;
  isCorrect: boolean;
};

export function PracticeClient({
  subjects,
  initialQuizzes,
  mode,
  initialSubjectIds,
  initialCount,
}: {
  subjects: Subject[];
  initialQuizzes: Quiz[] | null;
  mode?: string;
  initialSubjectIds: string[] | null;
  initialCount: number | null;
}) {
  const router = useRouter();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialSubjectIds ?? subjects.map((s) => s.id)
  );
  const [questionCount, setQuestionCount] = useState(initialCount ?? 10);

  // クイズ状態
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const toggleSubject = useCallback((id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const handleQuestionCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuestionCount(
        Math.max(1, Math.min(50, parseInt(e.target.value) || 10))
      );
    },
    []
  );

  const handleSetQuestionCount = useCallback((n: number) => {
    setQuestionCount(n);
  }, []);

  const handleSetUserAnswer = useCallback((answer: string) => {
    setUserAnswer(answer);
  }, []);

  const handleUserAnswerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUserAnswer(e.target.value);
    },
    []
  );

  const startPractice = () => {
    const params = new URLSearchParams({
      subjectIds: selectedSubjects.join(","),
      count: questionCount.toString(),
      started: "true",
    });
    if (mode) params.set("mode", mode);
    router.push(`/practice?${params}`);
  };

  // クイズがロードされていない場合は設定画面を表示
  if (!initialQuizzes) {
    const totalAvailableQuizzes = subjects
      .filter((s) => selectedSubjects.includes(s.id))
      .reduce((acc, s) => acc + s.quizCount, 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shuffle className="w-5 h-5" />
            演習設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 科目選択 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">出題科目を選択</label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <Badge
                  key={subject.id}
                  variant={
                    selectedSubjects.includes(subject.id)
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer transition-colors hover:bg-primary/80"
                  onClick={() => toggleSubject(subject.id)}
                >
                  {selectedSubjects.includes(subject.id) && (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  )}
                  {subject.name}
                  <span className="ml-1 opacity-70">({subject.quizCount})</span>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              選択中: {totalAvailableQuizzes} 問から出題可能
            </p>
          </div>

          {/* 出題数設定 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">出題数</label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={questionCount}
                onChange={handleQuestionCountChange}
                min={1}
                max={50}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">問</span>
            </div>
            <div className="flex gap-2">
              {[5, 10, 20, 30].map((n) => (
                <Button
                  key={n}
                  variant={questionCount === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSetQuestionCount(n)}
                >
                  {n}問
                </Button>
              ))}
            </div>
          </div>

          {/* 開始ボタン */}
          <Button
            onClick={startPractice}
            disabled={
              selectedSubjects.length === 0 ||
              questionCount > totalAvailableQuizzes
            }
            className="w-full h-12 text-base gap-2"
          >
            <Play className="w-5 h-5" />
            演習を開始
          </Button>

          {questionCount > totalAvailableQuizzes && (
            <p className="text-sm text-destructive text-center">
              出題数が利用可能な問題数を超えています
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // クイズが0件の場合
  if (initialQuizzes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shuffle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            {mode === "weakness"
              ? "苦手な問題がありません。素晴らしい！"
              : "選択した条件に該当する問題がありません"}
          </p>
          <Link href="/practice">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              設定を変更
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const currentQuiz = initialQuizzes[currentIndex];
  const currentResult = results.find((r) => r.quizId === currentQuiz?.id);

  const checkAnswer = async () => {
    if (!currentQuiz) return;

    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = currentQuiz.answer.trim().toLowerCase();

    let isCorrect = false;
    if (currentQuiz.quizType === "TRUE_FALSE") {
      isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    } else if (currentQuiz.quizType === "NUMBER") {
      isCorrect =
        parseFloat(normalizedUserAnswer) ===
        parseFloat(normalizedCorrectAnswer);
    } else if (currentQuiz.quizType === "MULTIPLE_CHOICE") {
      isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    } else {
      isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    }

    const result: QuizResult = {
      quizId: currentQuiz.id,
      userAnswer,
      isCorrect,
    };

    setResults((prev) => [
      ...prev.filter((r) => r.quizId !== currentQuiz.id),
      result,
    ]);
    setShowResult(true);

    await saveQuizResult(currentQuiz.id, isCorrect ? 100 : 0);
  };

  const nextQuiz = () => {
    if (currentIndex < initialQuizzes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setShowResult(false);
    } else {
      setIsComplete(true);
    }
  };

  // 完了画面
  if (isComplete) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const totalCount = initialQuizzes.length;
    const score = Math.round((correctCount / totalCount) * 100);
    const isPerfect = score === 100;
    const isGood = score >= 80;

    return (
      <Card className="overflow-hidden">
        <div
          className={`py-8 px-6 text-center ${isPerfect ? "bg-gradient-to-br from-success/10 to-success/5" : isGood ? "bg-gradient-to-br from-primary/10 to-primary/5" : "bg-gradient-to-br from-warning/10 to-warning/5"}`}
        >
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isPerfect ? "bg-success/20 text-success" : isGood ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning-foreground"}`}
          >
            <Trophy className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl mb-2">演習完了</CardTitle>
          <div
            className={`text-5xl font-bold mb-1 ${isPerfect ? "text-success" : isGood ? "text-primary" : "text-warning-foreground"}`}
          >
            {score}%
          </div>
          <p className="text-muted-foreground">
            {correctCount} / {totalCount} 正解
          </p>
          {isPerfect && (
            <Badge variant="success" className="mt-3 gap-1">
              <CheckCircle className="w-3 h-3" />
              パーフェクト！
            </Badge>
          )}
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {initialQuizzes.map((quiz, index) => {
              const result = results.find((r) => r.quizId === quiz.id);
              return (
                <div
                  key={quiz.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    result?.isCorrect
                      ? "bg-success/5 border-success/20"
                      : "bg-destructive/5 border-destructive/20"
                  }`}
                >
                  {result?.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">
                      問{index + 1}: {quiz.question.slice(0, 40)}...
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {quiz.subjectName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/practice" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                もう一度
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full gap-2">
                <Home className="w-4 h-4" />
                ホームへ
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuiz) {
    return null;
  }

  const progressPercent = (currentIndex / initialQuizzes.length) * 100;

  return (
    <Card className="overflow-hidden">
      {/* Progress Header */}
      <div className="bg-muted/50 px-6 py-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              問題 {currentIndex + 1} / {initialQuizzes.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {currentQuiz.subjectName}
            </Badge>
            <Badge variant="outline">
              {currentQuiz.quizType === "TRUE_FALSE" && "○×問題"}
              {currentQuiz.quizType === "SHORT_TEXT" && "短文回答"}
              {currentQuiz.quizType === "NUMBER" && "数値回答"}
              {currentQuiz.quizType === "MULTIPLE_CHOICE" && "選択式問題"}
            </Badge>
          </div>
        </div>
        <Progress value={progressPercent} size="sm" />
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Question */}
        <div className="text-lg font-medium leading-relaxed">
          {currentQuiz.question}
        </div>

        {!showResult ? (
          <div className="space-y-4">
            {currentQuiz.quizType === "TRUE_FALSE" ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={userAnswer === "true" ? "default" : "outline"}
                  onClick={() => handleSetUserAnswer("true")}
                  className={`h-14 text-base gap-2 ${userAnswer === "true" ? "" : "hover:border-primary/50"}`}
                >
                  <CheckCircle className="w-5 h-5" />○ 正しい
                </Button>
                <Button
                  variant={userAnswer === "false" ? "default" : "outline"}
                  onClick={() => handleSetUserAnswer("false")}
                  className={`h-14 text-base gap-2 ${userAnswer === "false" ? "" : "hover:border-primary/50"}`}
                >
                  <XCircle className="w-5 h-5" />× 誤り
                </Button>
              </div>
            ) : currentQuiz.quizType === "MULTIPLE_CHOICE" && currentQuiz.choices ? (
              <div className="space-y-2">
                {currentQuiz.choices.map((choice, index) => (
                  <Button
                    key={index}
                    variant={userAnswer === choice ? "default" : "outline"}
                    onClick={() => handleSetUserAnswer(choice)}
                    className={`w-full h-auto min-h-12 text-base justify-start px-4 py-3 text-left whitespace-normal ${
                      userAnswer === choice ? "" : "hover:border-primary/50"
                    }`}
                  >
                    <span className="w-6 shrink-0 font-medium">{String.fromCharCode(65 + index)}.</span>
                    <span className="flex-1">{choice}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <Input
                type={currentQuiz.quizType === "NUMBER" ? "number" : "text"}
                value={userAnswer}
                onChange={handleUserAnswerChange}
                placeholder={
                  currentQuiz.quizType === "NUMBER"
                    ? "数値を入力してください"
                    : "回答を入力してください"
                }
                className="h-12 text-base"
              />
            )}
            <Button
              onClick={checkAnswer}
              disabled={!userAnswer}
              className="w-full h-12 text-base gap-2"
            >
              回答する
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Result Banner */}
            <div
              className={`p-5 rounded-xl ${
                currentResult?.isCorrect
                  ? "bg-success/10 border border-success/30"
                  : "bg-destructive/10 border border-destructive/30"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {currentResult?.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-success" />
                ) : (
                  <XCircle className="w-6 h-6 text-destructive" />
                )}
                <span
                  className={`font-bold text-lg ${currentResult?.isCorrect ? "text-success" : "text-destructive"}`}
                >
                  {currentResult?.isCorrect ? "正解！" : "不正解"}
                </span>
              </div>
              <div className="text-sm space-y-1 pl-9">
                <div>
                  <span className="text-muted-foreground">正解: </span>
                  <span className="font-medium">
                    {currentQuiz.quizType === "TRUE_FALSE"
                      ? currentQuiz.answer === "true"
                        ? "○ (正しい)"
                        : "× (誤り)"
                      : currentQuiz.quizType === "MULTIPLE_CHOICE" && currentQuiz.choices
                        ? `${String.fromCharCode(65 + currentQuiz.choices.indexOf(currentQuiz.answer))}. ${currentQuiz.answer}`
                        : currentQuiz.answer}
                  </span>
                </div>
                {!currentResult?.isCorrect && (
                  <div>
                    <span className="text-muted-foreground">
                      あなたの回答:{" "}
                    </span>
                    <span className="font-medium">
                      {currentQuiz.quizType === "TRUE_FALSE"
                        ? userAnswer === "true"
                          ? "○ (正しい)"
                          : "× (誤り)"
                        : currentQuiz.quizType === "MULTIPLE_CHOICE" && currentQuiz.choices
                          ? `${String.fromCharCode(65 + currentQuiz.choices.indexOf(userAnswer))}. ${userAnswer}`
                          : userAnswer}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Explanation */}
            {currentQuiz.explanation && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 font-medium mb-2 text-primary">
                  <Lightbulb className="w-4 h-4" />
                  解説
                </div>
                <p className="text-sm leading-relaxed">
                  {currentQuiz.explanation}
                </p>
              </div>
            )}

            <Button
              onClick={nextQuiz}
              className="w-full h-12 text-base gap-2"
            >
              {currentIndex < initialQuizzes.length - 1
                ? "次の問題へ"
                : "結果を見る"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
