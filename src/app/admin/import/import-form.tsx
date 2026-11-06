"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importPastExams, type ImportPastExamsResult } from "./actions";

export function ImportForm() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ImportPastExamsResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleImport = () => {
    startTransition(async () => {
      setResult(await importPastExams(text));
    });
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={16}
        placeholder="過去問の JSON 配列を貼り付けてください"
        className="font-mono text-sm"
      />
      <Button onClick={handleImport} disabled={isPending || text.trim() === ""}>
        {isPending ? "取り込み中..." : "取り込む"}
      </Button>

      {result?.ok && (
        <p className="text-sm text-success">
          作成 {result.created} 件・更新 {result.updated} 件
        </p>
      )}
      {result && !result.ok && (
        <ul className="space-y-1 text-sm text-destructive">
          {result.errors.map((e, i) => (
            <li key={i}>
              {e.index >= 0 ? `${e.index + 1} 件目: ` : ""}
              {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
