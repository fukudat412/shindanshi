"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteTopic } from "./actions";

export function DeleteTopicButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`「${name}」を削除しますか？`)) {
      return;
    }
    startTransition(async () => {
      await deleteTopic(id);
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
