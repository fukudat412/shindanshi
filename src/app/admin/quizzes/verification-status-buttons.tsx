"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { VerificationStatus } from "@/generated/prisma/enums";
import {
  verificationStatusLabel,
  verificationStatuses,
} from "@/lib/quiz-eligibility";
import { updateQuizVerificationStatus } from "./actions";

export function VerificationStatusButtons({
  id,
  current,
}: {
  id: string;
  current: VerificationStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-1">
      {verificationStatuses.map((status) => (
        <Button
          key={status}
          variant={status === current ? "default" : "outline"}
          size="sm"
          disabled={isPending || status === current}
          onClick={() =>
            startTransition(async () => {
              await updateQuizVerificationStatus(id, status);
            })
          }
        >
          {verificationStatusLabel(status)}
        </Button>
      ))}
    </div>
  );
}
