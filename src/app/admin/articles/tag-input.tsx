"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  existingTags: string[];
  placeholder?: string;
};

export function TagInput({ value, onChange, existingTags, placeholder = "タグを入力..." }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // フィルタされた候補（まだ選択されていないもの）
  const suggestions = useMemo(
    () =>
      existingTags.filter(
        (tag) =>
          !value.includes(tag) &&
          tag.toLowerCase().includes(inputValue.toLowerCase())
      ),
    [existingTags, value, inputValue]
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // 外側クリックでサジェストを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] border-0 p-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* サジェスト */}
      {showSuggestions && inputValue && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-auto">
          {suggestions.map((tag, index) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                index === selectedIndex && "bg-accent"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 既存タグクイック選択 */}
      {!inputValue && existingTags.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-1">既存のタグから選択:</p>
          <div className="flex flex-wrap gap-1">
            {existingTags
              .filter((tag) => !value.includes(tag))
              .slice(0, 10)
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="focus:outline-none"
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-accent text-xs"
                  >
                    + {tag}
                  </Badge>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
