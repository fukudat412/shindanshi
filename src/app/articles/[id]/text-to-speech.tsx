"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Volume2, Square, Pause, Play } from "lucide-react";

interface TextToSpeechProps {
  text: string;
}

// 定数
const STORAGE_KEY = "tts-speed";
const DEFAULT_SPEED = 1.0;
const SPEED_MIN = 0.5;
const SPEED_MAX = 2.0;
const SPEED_STEP = 0.25;

// localStorageから速度を読み込む（クライアントサイドのみ）
function getInitialSpeed(): number {
  if (typeof window === "undefined") return DEFAULT_SPEED;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_SPEED;
  const parsed = parseFloat(saved);
  if (isNaN(parsed) || parsed < SPEED_MIN || parsed > SPEED_MAX) {
    return DEFAULT_SPEED;
  }
  return parsed;
}

// Web Speech APIのサポート確認（クライアントサイドのみ）
function checkSpeechSupport(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Markdownからプレーンテキストを抽出
function extractPlainText(markdown: string): string {
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
}

export function TextToSpeech({ text }: TextToSpeechProps) {
  // クライアントサイドでのみ初期化される状態
  const [isClient, setIsClient] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Markdownからプレーンテキストを抽出（メモ化）
  const plainText = useMemo(() => extractPlainText(text), [text]);

  // クライアントサイドでの初期化（ハイドレーション対策）
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setIsClient(true);
    const savedSpeed = getInitialSpeed();
    if (savedSpeed !== DEFAULT_SPEED) {
      setSpeed(savedSpeed);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (checkSpeechSupport()) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 速度変更時にlocalStorageに保存
  const handleSpeedChange = useCallback((value: number[]) => {
    const newSpeed = value[0];
    setSpeed(newSpeed);
    localStorage.setItem(STORAGE_KEY, newSpeed.toString());

    // 読み上げ中に速度を変更した場合は最初から再開
    // 注意: Web Speech APIの制限により、途中からの再開はできません
    if (isPlaying && plainText) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.lang = "ja-JP";
      utterance.rate = newSpeed;

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
      };

      utterance.onboundary = (event) => {
        if (event.charIndex !== undefined && plainText.length > 0) {
          const progressPercent = (event.charIndex / plainText.length) * 100;
          setProgress(Math.min(progressPercent, 100));
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPaused(false);
      setProgress(0);
    }
  }, [isPlaying, plainText]);

  const speak = useCallback(() => {
    if (!checkSpeechSupport() || !plainText) return;

    // 既存の読み上げをキャンセル
    window.speechSynthesis.cancel();
    setProgress(0);

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = "ja-JP";
    utterance.rate = speed;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    };

    utterance.onboundary = (event) => {
      if (event.charIndex !== undefined && plainText.length > 0) {
        const progressPercent = (event.charIndex / plainText.length) * 100;
        setProgress(Math.min(progressPercent, 100));
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [plainText, speed]);

  const pause = useCallback(() => {
    if (checkSpeechSupport() && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (checkSpeechSupport() && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    if (checkSpeechSupport()) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    }
  }, []);

  // SSR時またはWeb Speech API非対応時は何も表示しない
  if (!isClient || !checkSpeechSupport()) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* コントロールボタン */}
      <div className="flex items-center gap-2 flex-wrap">
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

        {/* 速度調整 */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">速度:</span>
          <Slider
            value={[speed]}
            onValueChange={handleSpeedChange}
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={SPEED_STEP}
            className="w-24"
          />
          <span className="text-sm font-medium w-10">{speed}x</span>
        </div>
      </div>

      {/* 進捗バー（読み上げ中のみ表示） */}
      {isPlaying && (
        <div className="flex items-center gap-2">
          <Progress value={progress} className="flex-1" />
          <span className="text-sm text-muted-foreground w-10 text-right">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}
