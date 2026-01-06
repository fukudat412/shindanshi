"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createMockExam } from "./actions";
import {
  ClipboardCheck,
  Play,
  CheckCircle,
  Clock,
  FileQuestion,
  Settings,
} from "lucide-react";

type Subject = {
  id: string;
  name: string;
  quizCount: number;
};

export function MockExamClient({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    subjects.map((s) => s.id)
  );
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimit, setTimeLimit] = useState(30);
  const [title, setTitle] = useState("");

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const totalAvailableQuizzes = subjects
    .filter((s) => selectedSubjects.includes(s.id))
    .reduce((acc, s) => acc + s.quizCount, 0);

  const startExam = () => {
    startTransition(async () => {
      const examId = await createMockExam(
        selectedSubjects,
        Math.min(questionCount, totalAvailableQuizzes),
        timeLimit,
        title || undefined
      );
      router.push(`/mock-exam/${examId}`);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5" />
          新しい模擬試験を作成
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 試験名（オプション） */}
        <div className="space-y-3">
          <label className="text-sm font-medium">試験名（オプション）</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 第1回総合模試"
            className="max-w-xs"
          />
        </div>

        {/* 科目選択 */}
        <div className="space-y-3">
          <label className="text-sm font-medium">出題科目を選択</label>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Badge
                key={subject.id}
                variant={
                  selectedSubjects.includes(subject.id) ? "default" : "outline"
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
          <label className="text-sm font-medium flex items-center gap-2">
            <FileQuestion className="w-4 h-4" />
            出題数
          </label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={questionCount}
              onChange={(e) =>
                setQuestionCount(
                  Math.max(1, Math.min(100, parseInt(e.target.value) || 10))
                )
              }
              min={1}
              max={100}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">問</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 30, 50].map((n) => (
              <Button
                key={n}
                variant={questionCount === n ? "default" : "outline"}
                size="sm"
                onClick={() => setQuestionCount(n)}
              >
                {n}問
              </Button>
            ))}
          </div>
        </div>

        {/* 制限時間設定 */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            制限時間
          </label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={timeLimit}
              onChange={(e) =>
                setTimeLimit(
                  Math.max(5, Math.min(180, parseInt(e.target.value) || 30))
                )
              }
              min={5}
              max={180}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">分</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[15, 30, 45, 60, 90].map((n) => (
              <Button
                key={n}
                variant={timeLimit === n ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeLimit(n)}
              >
                {n}分
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            1問あたり約{" "}
            {questionCount > 0
              ? Math.round((timeLimit * 60) / questionCount)
              : 0}{" "}
            秒
          </p>
        </div>

        {/* 開始ボタン */}
        <Button
          onClick={startExam}
          disabled={
            isPending ||
            selectedSubjects.length === 0 ||
            questionCount > totalAvailableQuizzes
          }
          className="w-full h-12 text-base gap-2"
        >
          {isPending ? (
            <>
              <ClipboardCheck className="w-5 h-5 animate-pulse" />
              準備中...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              模擬試験を開始
            </>
          )}
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
