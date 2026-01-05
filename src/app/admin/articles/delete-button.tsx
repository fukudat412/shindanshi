"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteArticle } from "./actions";

export function DeleteArticleButton({ id, title }: { id: string; title: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`「${title}」を削除しますか？関連するクイズもすべて削除されます。`)) {
      return;
    }
    startTransition(async () => {
      await deleteArticle(id);
    });
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? "削除中..." : "削除"}
    </Button>
  );
}
