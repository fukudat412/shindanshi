"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Square, Pause, Play } from "lucide-react";

interface TextToSpeechProps {
  text: string;
}

export function TextToSpeech({ text }: TextToSpeechProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Markdownからプレーンテキストを抽出
  const extractPlainText = useCallback((markdown: string): string => {
    return markdown
      // コードブロックを除去
      .replace(/```[\s\S]*?```/g, "")
      // インラインコードを除去
      .replace(/`[^`]+`/g, "")
      // 見出しの#を除去
      .replace(/^#{1,6}\s+/gm, "")
      // リンクをテキストのみに
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // 画像を除去
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      // 太字・斜体のマーカーを除去
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      // 水平線を除去
      .replace(/^[-*_]{3,}$/gm, "")
      // リストマーカーを除去
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // 引用を除去
      .replace(/^>\s+/gm, "")
      // LaTeX数式を「数式」に置換
      .replace(/\$\$[\s\S]*?\$\$/g, "数式")
      .replace(/\$[^$]+\$/g, "数式")
      // HTMLタグを除去
      .replace(/<[^>]+>/g, "")
      // 複数の空行を1つに
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }, []);

  const speak = useCallback(() => {
    if (!isSupported) return;

    const plainText = extractPlainText(text);
    if (!plainText) return;

    // 既存の読み上げをキャンセル
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = "ja-JP";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text, isSupported, extractPlainText]);

  const pause = useCallback(() => {
    if (isSupported && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isPlaying]);

  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isPaused]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {!isPlaying ? (
        <Button
          variant="outline"
          size="sm"
          onClick={speak}
          className="gap-2"
        >
          <Volume2 className="w-4 h-4" />
          読み上げ
        </Button>
      ) : (
        <>
          {isPaused ? (
            <Button
              variant="outline"
              size="sm"
              onClick={resume}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              再開
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={pause}
              className="gap-2"
            >
              <Pause className="w-4 h-4" />
              一時停止
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={stop}
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            停止
          </Button>
        </>
      )}
    </div>
  );
}
