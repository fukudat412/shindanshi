"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bulkCreateQuizzes } from "./actions";
import { Plus, Trash2, Wand2 } from "lucide-react";

type Topic = {
  id: string;
  name: string;
  description: string | null;
  subject: { id: string; name: string };
  articles: { id: string; title: string }[];
};

type QuizType = "TRUE_FALSE" | "SHORT_TEXT" | "NUMBER" | "MULTIPLE_CHOICE";
type QuizPhase = "INTRO" | "UNDERSTAND" | "RETAIN" | "EXAM";

type QuizDraft = {
  id: string;
  question: string;
  quizType: QuizType;
  phase: QuizPhase;
  answer: string;
  choices: string[];
  explanation: string;
};

const PHASE_LABELS: Record<QuizPhase, { label: string; description: string }> = {
  INTRO: { label: "導入", description: "定義確認（○×/短文）" },
  UNDERSTAND: { label: "理解", description: "判断基準・手順（4択）" },
  RETAIN: { label: "定着", description: "ひっかけ・逆方向（4択）" },
  EXAM: { label: "試験", description: "ミニケース（4択）" },
};

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  TRUE_FALSE: "○×",
  SHORT_TEXT: "短文",
  NUMBER: "数値",
  MULTIPLE_CHOICE: "4択",
};

// テンプレートに基づいた初期問題セット
function generateTemplateQuizzes(topicName: string): QuizDraft[] {
  return [
    {
      id: crypto.randomUUID(),
      question: `${topicName}とは、【定義】である。`,
      quizType: "TRUE_FALSE",
      phase: "INTRO",
      answer: "",
      choices: [],
      explanation: "",
    },
    {
      id: crypto.randomUUID(),
      question: `${topicName}において、正しい判断基準はどれか。`,
      quizType: "MULTIPLE_CHOICE",
      phase: "UNDERSTAND",
      answer: "",
      choices: ["", "", "", ""],
      explanation: "",
    },
    {
      id: crypto.randomUUID(),
      question: `${topicName}の実施手順として正しいものはどれか。`,
      quizType: "MULTIPLE_CHOICE",
      phase: "UNDERSTAND",
      answer: "",
      choices: ["", "", "", ""],
      explanation: "",
    },
    {
      id: crypto.randomUUID(),
      question: `${topicName}について、誤っているものはどれか。`,
      quizType: "MULTIPLE_CHOICE",
      phase: "RETAIN",
      answer: "",
      choices: ["", "", "", ""],
      explanation: "",
    },
    {
      id: crypto.randomUUID(),
      question: `【原因】の場合、${topicName}はどうなるか。`,
      quizType: "MULTIPLE_CHOICE",
      phase: "RETAIN",
      answer: "",
      choices: ["", "", "", ""],
      explanation: "",
    },
  ];
}

export function GenerateForm({ topics }: { topics: Topic[] }) {
  const [topicId, setTopicId] = useState("");
  const [articleId, setArticleId] = useState("");
  const [quizzes, setQuizzes] = useState<QuizDraft[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const selectedTopic = topics.find((t) => t.id === topicId);

  const handleTopicChange = (newTopicId: string) => {
    setTopicId(newTopicId);
    setArticleId("");
    const topic = topics.find((t) => t.id === newTopicId);
    if (topic) {
      setQuizzes(generateTemplateQuizzes(topic.name));
      // 記事が1つしかない場合は自動選択
      if (topic.articles.length === 1) {
        setArticleId(topic.articles[0].id);
      }
    } else {
      setQuizzes([]);
    }
  };

  const updateQuiz = (id: string, updates: Partial<QuizDraft>) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const updateChoice = (quizId: string, index: number, value: string) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id !== quizId) return q;
        const newChoices = [...q.choices];
        newChoices[index] = value;
        return { ...q, choices: newChoices };
      })
    );
  };

  const setCorrectChoice = (quizId: string, choice: string) => {
    updateQuiz(quizId, { answer: choice });
  };

  const addQuiz = () => {
    const topicName = selectedTopic?.name || "論点";
    setQuizzes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        question: `${topicName}について、【質問内容】`,
        quizType: "MULTIPLE_CHOICE",
        phase: "UNDERSTAND",
        answer: "",
        choices: ["", "", "", ""],
        explanation: "",
      },
    ]);
  };

  const removeQuiz = (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    const validQuizzes = quizzes.filter((q) => {
      if (!q.question.trim() || !q.answer.trim()) return false;
      if (q.quizType === "MULTIPLE_CHOICE") {
        const filledChoices = q.choices.filter((c) => c.trim());
        if (filledChoices.length < 2) return false;
        // 正解が選択肢に含まれているか確認
        if (!filledChoices.includes(q.answer)) return false;
      }
      return true;
    });

    if (validQuizzes.length === 0) {
      setMessage("有効な問題がありません");
      return;
    }

    startTransition(async () => {
      const result = await bulkCreateQuizzes({
        topicId,
        articleId,
        quizzes: validQuizzes.map((q) => ({
          question: q.question,
          quizType: q.quizType,
          phase: q.phase,
          answer: q.answer,
          choices: q.quizType === "MULTIPLE_CHOICE"
            ? q.choices.filter((c) => c.trim())
            : [],
          explanation: q.explanation.trim() || null,
        })),
      });

      if (result.success) {
        setMessage(`${result.count}問を作成しました`);
        setQuizzes([]);
        setTopicId("");
        setArticleId("");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result.error || "エラーが発生しました");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 論点・記事選択 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="topicId">論点を選択</Label>
          <select
            id="topicId"
            value={topicId}
            onChange={(e) => handleTopicChange(e.target.value)}
            className="w-full h-10 px-3 border rounded-md"
            required
          >
            <option value="">論点を選択...</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                [{topic.subject.name}] {topic.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="articleId">紐付ける記事</Label>
          <select
            id="articleId"
            value={articleId}
            onChange={(e) => setArticleId(e.target.value)}
            className="w-full h-10 px-3 border rounded-md"
            required
            disabled={!topicId}
          >
            <option value="">記事を選択...</option>
            {selectedTopic?.articles.map((article) => (
              <option key={article.id} value={article.id}>
                {article.title}
              </option>
            ))}
          </select>
          {topicId && selectedTopic?.articles.length === 0 && (
            <p className="text-sm text-red-500">
              この論点に紐付く記事がありません
            </p>
          )}
        </div>
      </div>

      {/* 問題一覧 */}
      {quizzes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              生成する問題 ({quizzes.length}問)
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={addQuiz}>
              <Plus className="w-4 h-4 mr-1" />
              問題を追加
            </Button>
          </div>

          {quizzes.map((quiz, index) => (
            <Card key={quiz.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">問題 {index + 1}</CardTitle>
                    <Badge variant="outline">
                      {PHASE_LABELS[quiz.phase].label}
                    </Badge>
                    <Badge variant="secondary">
                      {QUIZ_TYPE_LABELS[quiz.quizType]}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuiz(quiz.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* フェーズ・タイプ選択 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>フェーズ</Label>
                    <select
                      value={quiz.phase}
                      onChange={(e) =>
                        updateQuiz(quiz.id, { phase: e.target.value as QuizPhase })
                      }
                      className="w-full h-10 px-3 border rounded-md"
                    >
                      {Object.entries(PHASE_LABELS).map(([key, { label, description }]) => (
                        <option key={key} value={key}>
                          {label}（{description}）
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>タイプ</Label>
                    <select
                      value={quiz.quizType}
                      onChange={(e) => {
                        const newType = e.target.value as QuizType;
                        updateQuiz(quiz.id, {
                          quizType: newType,
                          answer: "",
                          choices: newType === "MULTIPLE_CHOICE" ? ["", "", "", ""] : [],
                        });
                      }}
                      className="w-full h-10 px-3 border rounded-md"
                    >
                      <option value="TRUE_FALSE">○×問題</option>
                      <option value="SHORT_TEXT">短文回答</option>
                      <option value="NUMBER">数値回答</option>
                      <option value="MULTIPLE_CHOICE">選択式問題</option>
                    </select>
                  </div>
                </div>

                {/* 問題文 */}
                <div className="space-y-2">
                  <Label>問題文</Label>
                  <Textarea
                    value={quiz.question}
                    onChange={(e) => updateQuiz(quiz.id, { question: e.target.value })}
                    rows={2}
                    placeholder="問題文を入力..."
                  />
                </div>

                {/* 選択肢（MULTIPLE_CHOICE の場合） */}
                {quiz.quizType === "MULTIPLE_CHOICE" && (
                  <div className="space-y-2">
                    <Label>選択肢（ラジオで正解を選択）</Label>
                    {quiz.choices.map((choice, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-6 text-sm text-muted-foreground">
                          {i + 1}.
                        </span>
                        <Input
                          value={choice}
                          onChange={(e) => updateChoice(quiz.id, i, e.target.value)}
                          placeholder={`選択肢 ${i + 1}`}
                        />
                        <input
                          type="radio"
                          name={`correct-${quiz.id}`}
                          checked={quiz.answer === choice && choice !== ""}
                          onChange={() => setCorrectChoice(quiz.id, choice)}
                          className="w-4 h-4"
                          title="正解を選択"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 正解（TRUE_FALSE の場合） */}
                {quiz.quizType === "TRUE_FALSE" && (
                  <div className="space-y-2">
                    <Label>正解</Label>
                    <select
                      value={quiz.answer}
                      onChange={(e) => updateQuiz(quiz.id, { answer: e.target.value })}
                      className="w-full h-10 px-3 border rounded-md"
                    >
                      <option value="">選択してください</option>
                      <option value="true">○（正しい）</option>
                      <option value="false">×（誤り）</option>
                    </select>
                  </div>
                )}

                {/* 正解（SHORT_TEXT / NUMBER の場合） */}
                {(quiz.quizType === "SHORT_TEXT" || quiz.quizType === "NUMBER") && (
                  <div className="space-y-2">
                    <Label>正解</Label>
                    <Input
                      type={quiz.quizType === "NUMBER" ? "number" : "text"}
                      value={quiz.answer}
                      onChange={(e) => updateQuiz(quiz.id, { answer: e.target.value })}
                      placeholder="正解を入力..."
                    />
                  </div>
                )}

                {/* 解説 */}
                <div className="space-y-2">
                  <Label>解説</Label>
                  <Textarea
                    value={quiz.explanation}
                    onChange={(e) => updateQuiz(quiz.id, { explanation: e.target.value })}
                    rows={2}
                    placeholder="解説を入力..."
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 送信ボタン */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={isPending || quizzes.length === 0 || !articleId}
        >
          <Wand2 className="w-4 h-4 mr-2" />
          {isPending ? "作成中..." : `${quizzes.length}問を一括作成`}
        </Button>
        {message && (
          <span
            className={
              message.includes("エラー") || message.includes("ありません")
                ? "text-red-600"
                : "text-green-600"
            }
          >
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
