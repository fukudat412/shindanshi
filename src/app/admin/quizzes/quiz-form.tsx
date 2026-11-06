"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compactChoices } from "@/lib/quiz-explanation";
import { createQuiz } from "./actions";

type Article = {
  id: string;
  title: string;
  subject: { id: string; name: string };
};

type Topic = {
  id: string;
  name: string;
  subjectId: string;
};

type QuizType = "TRUE_FALSE" | "SHORT_TEXT" | "NUMBER" | "MULTIPLE_CHOICE";
type QuizPhase = "INTRO" | "UNDERSTAND" | "RETAIN" | "EXAM";

export function QuizForm({
  articles,
  topics,
  defaultArticleId,
}: {
  articles: Article[];
  topics: Topic[];
  defaultArticleId?: string;
}) {
  const [articleId, setArticleId] = useState(defaultArticleId || articles[0]?.id || "");
  const [topicId, setTopicId] = useState("");
  const [question, setQuestion] = useState("");
  const [quizType, setQuizType] = useState<QuizType>("TRUE_FALSE");
  const [phase, setPhase] = useState<QuizPhase>("UNDERSTAND");
  const [answer, setAnswer] = useState("");
  const [choices, setChoices] = useState<string[]>(["", "", "", ""]);
  const [choiceExplanations, setChoiceExplanations] = useState<string[]>(["", "", "", ""]);
  const [explanation, setExplanation] = useState("");
  const [basis, setBasis] = useState("");
  const [basisYear, setBasisYear] = useState("");
  const [order, setOrder] = useState("0");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  // 選択された記事の科目IDを取得
  const selectedArticle = articles.find((a) => a.id === articleId);
  const selectedSubjectId = selectedArticle?.subject.id;
  // その科目に属するtopicsをフィルタ
  const filteredTopics = topics.filter((t) => t.subjectId === selectedSubjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const compacted = quizType === "MULTIPLE_CHOICE"
        ? compactChoices(choices, choiceExplanations)
        : { choices: [], choiceExplanations: [] };
      const result = await createQuiz({
        articleId,
        topicId: topicId || null,
        question,
        quizType,
        phase,
        answer,
        choices: compacted.choices,
        choiceExplanations: compacted.choiceExplanations,
        basis: basis.trim() || null,
        basisYear: basisYear.trim() === "" ? null : Number(basisYear),
        explanation: explanation || null,
        order: parseInt(order, 10),
      });
      if (result.success) {
        setQuestion("");
        setAnswer("");
        setChoices(["", "", "", ""]);
        setChoiceExplanations(["", "", "", ""]);
        setExplanation("");
        setBasis("");
        setBasisYear("");
        setOrder("0");
        setMessage("クイズを作成しました");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result.error || "エラーが発生しました");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="articleId">記事</Label>
          <select
            id="articleId"
            value={articleId}
            onChange={(e) => {
              setArticleId(e.target.value);
              setTopicId(""); // 記事が変わったらtopicをリセット
            }}
            className="w-full h-10 px-3 border rounded-md"
            required
          >
            {articles.map((article) => (
              <option key={article.id} value={article.id}>
                [{article.subject.name}] {article.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="topicId">論点（任意）</Label>
          <select
            id="topicId"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full h-10 px-3 border rounded-md"
          >
            <option value="">選択しない</option>
            {filteredTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quizType">クイズタイプ</Label>
          <select
            id="quizType"
            value={quizType}
            onChange={(e) => setQuizType(e.target.value as QuizType)}
            className="w-full h-10 px-3 border rounded-md"
          >
            <option value="TRUE_FALSE">○×問題</option>
            <option value="SHORT_TEXT">短文回答</option>
            <option value="NUMBER">数値回答</option>
            <option value="MULTIPLE_CHOICE">選択式問題</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phase">学習フェーズ</Label>
          <select
            id="phase"
            value={phase}
            onChange={(e) => setPhase(e.target.value as QuizPhase)}
            className="w-full h-10 px-3 border rounded-md"
          >
            <option value="INTRO">導入（定義確認）</option>
            <option value="UNDERSTAND">理解（判断基準）</option>
            <option value="RETAIN">定着（ひっかけ）</option>
            <option value="EXAM">試験対策（実践）</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="question">問題文</Label>
        <Textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例: NPVがプラスの投資案は採用すべきである"
          rows={3}
          required
        />
      </div>

      {quizType === "MULTIPLE_CHOICE" && (
        <div className="space-y-3">
          <Label>選択肢（2〜4個入力）</Label>
          {choices.map((choice, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 text-sm text-muted-foreground">{index + 1}.</span>
                <Input
                  value={choice}
                  onChange={(e) => {
                    const newChoices = [...choices];
                    newChoices[index] = e.target.value;
                    setChoices(newChoices);
                  }}
                  placeholder={`選択肢 ${index + 1}`}
                />
                <input
                  type="radio"
                  name="correctChoice"
                  checked={answer === choice && choice !== ""}
                  onChange={() => setAnswer(choice)}
                  className="w-4 h-4"
                  title="正解を選択"
                />
              </div>
              <Textarea
                value={choiceExplanations[index] ?? ""}
                onChange={(e) => {
                  const next = [...choiceExplanations];
                  next[index] = e.target.value;
                  setChoiceExplanations(next);
                }}
                placeholder={`選択肢 ${index + 1} の解説（任意）`}
                aria-label={`選択肢 ${index + 1} の解説`}
                rows={2}
                className="ml-8 w-auto"
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            ラジオボタンで正解の選択肢を選んでください
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="answer">
            正解
            {quizType === "TRUE_FALSE" && " (true または false)"}
            {quizType === "MULTIPLE_CHOICE" && " (上の選択肢から選択)"}
          </Label>
          {quizType === "TRUE_FALSE" ? (
            <select
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full h-10 px-3 border rounded-md"
              required
            >
              <option value="">選択してください</option>
              <option value="true">○ (正しい)</option>
              <option value="false">× (誤り)</option>
            </select>
          ) : quizType === "MULTIPLE_CHOICE" ? (
            <Input
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="上の選択肢から選択されます"
              required
              readOnly
              className="bg-muted"
            />
          ) : (
            <Input
              id="answer"
              type={quizType === "NUMBER" ? "number" : "text"}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={quizType === "NUMBER" ? "例: 100" : "例: 正味現在価値"}
              required
            />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="order">表示順序</Label>
          <Input
            id="order"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">解説（任意）</Label>
        <Textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="問題の解説を入力..."
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
        <div className="space-y-2">
          <Label htmlFor="basis">根拠（任意）</Label>
          <Textarea
            id="basis"
            value={basis}
            onChange={(e) => setBasis(e.target.value)}
            placeholder="根拠となる条文・テキストなど..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basisYear">基準年度（任意）</Label>
          <Input
            id="basisYear"
            type="number"
            value={basisYear}
            onChange={(e) => setBasisYear(e.target.value)}
            placeholder="例: 2025"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "作成中..." : "クイズを追加"}
        </Button>
        {message && (
          <span className={message.includes("エラー") ? "text-red-600" : "text-green-600"}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
