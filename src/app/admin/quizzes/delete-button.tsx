"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteQuiz } from "./actions";

export function DeleteQuizButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("このクイズを削除しますか？")) {
      return;
    }
    startTransition(async () => {
      await deleteQuiz(id);
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
