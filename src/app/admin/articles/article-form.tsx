"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createArticle } from "./actions";
import { TagInput } from "./tag-input";

type Subject = {
  id: string;
  name: string;
};

export function ArticleForm({
  subjects,
  defaultSubjectId,
  existingTags = [],
}: {
  subjects: Subject[];
  defaultSubjectId?: string;
  existingTags?: string[];
}) {
  const [subjectId, setSubjectId] = useState(defaultSubjectId || subjects[0]?.id || "");
  const [title, setTitle] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [order, setOrder] = useState("0");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createArticle({
        subjectId,
        title,
        bodyMd,
        tags,
        order: parseInt(order, 10),
      });
      if (result.success) {
        setTitle("");
        setBodyMd("");
        setTags([]);
        setOrder("0");
        setMessage("記事を作成しました");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result.error || "エラーが発生しました");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subjectId">科目</Label>
          <select
            id="subjectId"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full h-10 px-3 border rounded-md"
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
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: NPV（正味現在価値）の計算方法"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>タグ</Label>
        <TagInput
          value={tags}
          onChange={setTags}
          existingTags={existingTags}
          placeholder="タグを入力（Enterで追加）"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bodyMd">本文（Markdown）</Label>
        <Textarea
          id="bodyMd"
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          placeholder="# 見出し&#10;&#10;本文をMarkdown形式で入力..."
          rows={15}
          required
        />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "作成中..." : "記事を追加"}
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
