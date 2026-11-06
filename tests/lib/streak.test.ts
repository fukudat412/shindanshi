import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { countStreak, toJstDay } from "@/lib/streak";

const today = new Date("2026-11-06T00:00:00.000Z");

describe("toJstDay", () => {
  it("T-004 AC1 JST 0時ちょうどで翌日に切り替わる", () => {
    expect(toJstDay(new Date("2026-11-05T15:00:00Z")).toISOString()).toBe(
      "2026-11-06T00:00:00.000Z"
    );
    expect(toJstDay(new Date("2026-11-05T14:59:59Z")).toISOString()).toBe(
      "2026-11-05T00:00:00.000Z"
    );
  });
});

describe("countStreak", () => {
  it("T-004 AC2 今日・昨日・一昨日に記録があれば3", () => {
    const keys = new Set(["2026-11-06", "2026-11-05", "2026-11-04"]);
    expect(countStreak(keys, today, 30)).toBe(3);
  });

  it("T-004 AC3 今日の記録がなくても昨日から続いていれば継続", () => {
    const keys = new Set(["2026-11-05", "2026-11-04"]);
    expect(countStreak(keys, today, 30)).toBe(2);
  });

  it("T-004 AC4 昨日の記録がなければ今日の有無だけで決まる", () => {
    expect(countStreak(new Set(["2026-11-06", "2026-11-04"]), today, 30)).toBe(1);
    expect(countStreak(new Set(["2026-11-04", "2026-11-03"]), today, 30)).toBe(0);
  });

  it("T-004 AC5 maxDays で打ち切る", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 50; i++) {
      keys.add(new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10));
    }
    expect(countStreak(keys, today, 30)).toBe(30);
  });

  it("T-004 AC6 月またぎ・年またぎも連続として数える", () => {
    const keys = new Set(["2027-01-01", "2026-12-31", "2026-12-30"]);
    expect(countStreak(keys, new Date("2027-01-01T00:00:00.000Z"), 30)).toBe(3);
    const monthKeys = new Set(["2026-11-01", "2026-10-31"]);
    expect(countStreak(monthKeys, new Date("2026-11-01T00:00:00.000Z"), 30)).toBe(2);
  });
});

describe("streak-actions.ts", () => {
  it("T-004 AC7 streak.ts の関数を使い、オフセット計算と数え上げループを持たない", () => {
    const src = readFileSync("src/lib/streak-actions.ts", "utf8");
    expect(src).toMatch(/import\s*\{[^}]*\bcountStreak\b[^}]*\}\s*from\s*"@\/lib\/streak"/);
    expect(src).toMatch(/import\s*\{[^}]*\btoJstDay\b[^}]*\}\s*from\s*"@\/lib\/streak"/);
    expect(src).toMatch(/\bcountStreak\(/);
    expect(src).toMatch(/\btoJstDay\(/);
    expect(src).not.toMatch(/9\s*\*\s*60/);
    expect(src).not.toMatch(/\bfor\s*\(/);
  });
});
