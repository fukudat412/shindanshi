"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tag, X } from "lucide-react";

type Props = {
  allTags: string[];
  subjectId: string;
};

export function TagFilter({ allTags, subjectId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const mode = (searchParams.get("mode") as "and" | "or") || "or";

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    updateUrl(newTags, mode);
  };

  const toggleMode = () => {
    const newMode = mode === "and" ? "or" : "and";
    updateUrl(selectedTags, newMode);
  };

  const clearFilter = () => {
    router.push(`/subjects/${subjectId}`);
  };

  const updateUrl = (tags: string[], searchMode: string) => {
    const params = new URLSearchParams();
    if (tags.length > 0) {
      params.set("tags", tags.join(","));
      params.set("mode", searchMode);
    }
    const query = params.toString();
    router.push(`/subjects/${subjectId}${query ? `?${query}` : ""}`);
  };

  if (allTags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Tag className="w-4 h-4" />
          タグでフィルタ
        </div>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-7 px-2 text-xs gap-1"
          >
            <X className="w-3 h-3" />
            クリア
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
            >
              <Badge
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected && "ring-2 ring-primary/20"
                )}
              >
                {tag}
              </Badge>
            </button>
          );
        })}
      </div>

      {selectedTags.length >= 2 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">検索モード:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMode}
            className="h-7 px-3 text-xs"
          >
            {mode === "and" ? "AND（すべて含む）" : "OR（いずれか含む）"}
          </Button>
        </div>
      )}
    </div>
  );
}
