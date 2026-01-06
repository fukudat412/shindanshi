"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, Check } from "lucide-react";
import { addQuestionToExam } from "../actions";

type Quiz = {
  id: string;
  question: string;
  quizType: string;
  articleTitle: string;
};

type Props = {
  examId: string;
  availableQuizzes: Quiz[];
};

export default function AddQuestionDialog({ examId, availableQuizzes }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const filteredQuizzes = availableQuizzes.filter(
    (quiz) =>
      quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.articleTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async (quizId: string) => {
    setIsAdding(quizId);
    try {
      await addQuestionToExam(examId, quizId);
    } finally {
      setIsAdding(null);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4" />
        問題を追加
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[80vh] mx-4 flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between shrink-0">
          <div>
            <CardTitle>問題を追加</CardTitle>
            <CardDescription>
              追加する問題を選択してください
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="問題を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {availableQuizzes.length === 0
                  ? "追加できる問題がありません"
                  : "検索結果がありません"}
              </div>
            ) : (
              filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{quiz.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {quiz.articleTitle}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {quiz.quizType === "TRUE_FALSE" && "正誤"}
                    {quiz.quizType === "MULTIPLE_CHOICE" && "選択"}
                    {quiz.quizType === "SHORT_TEXT" && "記述"}
                    {quiz.quizType === "NUMBER" && "数値"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdd(quiz.id)}
                    disabled={isAdding === quiz.id}
                  >
                    {isAdding === quiz.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t mt-4 shrink-0">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full">
              閉じる
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
