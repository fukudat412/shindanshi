"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteSubject } from "./actions";

export function DeleteSubjectButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`「${name}」を削除しますか？関連する記事・クイズもすべて削除されます。`)) {
      return;
    }
    startTransition(async () => {
      await deleteSubject(id);
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
