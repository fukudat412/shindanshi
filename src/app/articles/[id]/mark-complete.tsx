"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markArticleComplete } from "./actions";

export function MarkAsComplete({ articleId }: { articleId: string }) {
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    startTransition(async () => {
      await markArticleComplete(articleId);
      setCompleted(true);
    });
  };

  if (completed) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <span>✓</span>
        <span>記事を完了としてマークしました</span>
      </div>
    );
  }

  return (
    <Button onClick={handleComplete} disabled={isPending} variant="secondary">
      {isPending ? "処理中..." : "この記事を完了としてマーク"}
    </Button>
  );
}
