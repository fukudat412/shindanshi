"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTopic } from "./actions";

type Subject = {
  id: string;
  name: string;
};

export function TopicForm({ subjects }: { subjects: Subject[] }) {
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("0");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      setMessage("科目を選択してください");
      return;
    }
    startTransition(async () => {
      const result = await createTopic(name, subjectId, description, parseInt(order, 10));
      if (result.success) {
        setName("");
        setDescription("");
        setOrder("0");
        setMessage("論点を作成しました");
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
            <option value="">科目を選択</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">論点名</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: NPV（正味現在価値）"
            required
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="description">説明（任意）</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="この論点の概要"
            rows={2}
          />
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
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "作成中..." : "論点を追加"}
        </Button>
        {message && (
          <span className={message.includes("エラー") || message.includes("選択") ? "text-red-600" : "text-green-600"}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
