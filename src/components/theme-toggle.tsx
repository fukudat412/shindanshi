"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";

// クライアントサイドでのみマウント状態を検出
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  if (!isMounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
    );
  }

  const themes = [
    { value: "light", icon: Sun, label: "ライト" },
    { value: "dark", icon: Moon, label: "ダーク" },
    { value: "system", icon: Monitor, label: "システム" },
  ];

  const currentIndex = themes.findIndex((t) => t.value === theme);
  const nextTheme = themes[(currentIndex + 1) % themes.length];
  const CurrentIcon = themes[currentIndex]?.icon || Monitor;

  return (
    <button
      onClick={() => setTheme(nextTheme.value)}
      className={cn(
        "p-2 rounded-lg transition-colors",
        "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
      aria-label={`テーマを${nextTheme.label}に変更`}
      title={`現在: ${themes[currentIndex]?.label || "システム"}`}
    >
      <CurrentIcon className="w-5 h-5" />
    </button>
  );
}
