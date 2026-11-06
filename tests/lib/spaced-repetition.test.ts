import { describe, expect, it } from "vitest";
import { calculateSM2 } from "@/lib/spaced-repetition";

// ローカル時刻で固定（実装も setDate / setHours でローカル時刻を使う）
const now = new Date(2026, 0, 10, 15, 30, 45);

describe("calculateSM2", () => {
  it("T-001 AC1 now を省略すると現在時刻を基準にする", () => {
    const before = new Date();
    const result = calculateSM2({
      isCorrect: true,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
    });
    const expected = new Date(before);
    expected.setDate(expected.getDate() + 1);
    expected.setHours(0, 0, 0, 0);
    // 日付またぎの瞬間を除き、翌日 0:00 になる
    const after = new Date();
    if (before.getDate() === after.getDate()) {
      expect(result.nextReviewAt).toEqual(expected);
    }
  });

  it("T-001 AC1 now を渡すとその時刻を基準にし、渡した Date を変更しない", () => {
    const base = new Date(now);
    calculateSM2(
      { isCorrect: true, easeFactor: 2.5, interval: 0, repetitions: 0 },
      base,
    );
    expect(base).toEqual(now);
  });

  it("T-001 AC2 初回正解で interval が 1、nextReviewAt が翌日 0:00 になる", () => {
    const result = calculateSM2(
      { isCorrect: true, easeFactor: 2.5, interval: 0, repetitions: 0 },
      now,
    );
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.nextReviewAt).toEqual(new Date(2026, 0, 11, 0, 0, 0, 0));
  });

  it("T-001 AC3 2回目正解で interval が 6 になる", () => {
    const result = calculateSM2(
      { isCorrect: true, easeFactor: 2.5, interval: 1, repetitions: 1 },
      now,
    );
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
    expect(result.nextReviewAt).toEqual(new Date(2026, 0, 16, 0, 0, 0, 0));
  });

  it("T-001 AC3 3回目以降は Math.round(前回 interval × easeFactor) になる", () => {
    const result = calculateSM2(
      { isCorrect: true, easeFactor: 2.3, interval: 6, repetitions: 2 },
      now,
    );
    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(Math.round(6 * 2.3));
    expect(result.interval).toBe(14);
    expect(result.nextReviewAt).toEqual(new Date(2026, 0, 24, 0, 0, 0, 0));
  });

  it("T-001 AC4 正解時の easeFactor は +0.1 される", () => {
    const result = calculateSM2(
      { isCorrect: true, easeFactor: 2.0, interval: 1, repetitions: 1 },
      now,
    );
    expect(result.easeFactor).toBeCloseTo(2.1, 10);
  });

  it("T-001 AC4 正解時の easeFactor は 2.5 を超えない", () => {
    const result = calculateSM2(
      { isCorrect: true, easeFactor: 2.5, interval: 1, repetitions: 1 },
      now,
    );
    expect(result.easeFactor).toBe(2.5);
  });

  it("T-001 AC5 不正解で repetitions 0・interval 1 にリセットされる", () => {
    const result = calculateSM2(
      { isCorrect: false, easeFactor: 2.5, interval: 14, repetitions: 3 },
      now,
    );
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.nextReviewAt).toEqual(new Date(2026, 0, 11, 0, 0, 0, 0));
  });

  it("T-001 AC5 不正解で easeFactor は -0.2 される", () => {
    const result = calculateSM2(
      { isCorrect: false, easeFactor: 2.5, interval: 14, repetitions: 3 },
      now,
    );
    expect(result.easeFactor).toBeCloseTo(2.3, 10);
  });

  it("T-001 AC5 不正解でも easeFactor は 1.3 を下回らない", () => {
    const result = calculateSM2(
      { isCorrect: false, easeFactor: 1.4, interval: 6, repetitions: 2 },
      now,
    );
    expect(result.easeFactor).toBe(1.3);
  });
});
