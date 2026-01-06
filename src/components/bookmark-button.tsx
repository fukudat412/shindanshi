"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleBookmark } from "@/lib/bookmark-actions";
import { TargetType } from "@prisma/client";
import { cn } from "@/lib/utils";

type BookmarkButtonProps = {
  targetType: TargetType;
  targetId: string;
  initialBookmarked: boolean;
  variant?: "default" | "icon";
  className?: string;
};

export function BookmarkButton({
  targetType,
  targetId,
  initialBookmarked,
  variant = "default",
  className,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await toggleBookmark(targetType, targetId);
      if (result.success) {
        setIsBookmarked(result.bookmarked ?? false);
      }
    });
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "p-2 rounded-lg transition-colors",
          isBookmarked
            ? "text-yellow-500 hover:text-yellow-600"
            : "text-muted-foreground hover:text-foreground",
          isPending && "opacity-50",
          className
        )}
        aria-label={isBookmarked ? "ブックマーク解除" : "ブックマークに追加"}
        title={isBookmarked ? "ブックマーク解除" : "ブックマークに追加"}
      >
        <Bookmark
          className={cn("w-5 h-5", isBookmarked && "fill-current")}
        />
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant={isBookmarked ? "default" : "outline"}
      size="sm"
      className={cn(
        "gap-2",
        isBookmarked && "bg-yellow-500 hover:bg-yellow-600 text-white",
        className
      )}
    >
      <Bookmark
        className={cn("w-4 h-4", isBookmarked && "fill-current")}
      />
      {isBookmarked ? "ブックマーク済み" : "ブックマーク"}
    </Button>
  );
}
