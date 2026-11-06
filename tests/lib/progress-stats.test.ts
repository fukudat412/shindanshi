import { describe, expect, it } from "vitest";
import { summarizeBySubject, summarizeOverall } from "@/lib/progress-stats";

const quiz = (id: string, sid: string, order: number) => ({
  id,
  article: { subject: { id: sid, name: `科目${sid}`, order } },
});
const prog = (targetId: string, score: number | null, attemptCount = 1) => ({
  targetId,
  score,
  attemptCount,
});

const quizzes = [
  quiz("q1", "B", 2),
  quiz("q2", "A", 1),
  quiz("q3", "A", 1),
  quiz("q4", "C", 3),
];

describe("summarizeBySubject", () => {
  it("T-003 AC1 score 100 を正解として correct/total/accuracy を返す", () => {
    const r = summarizeBySubject(
      [prog("q2", 100), prog("q3", 50), prog("q1", 100)],
      quizzes
    );
    const a = r.find((s) => s.id === "A")!;
    expect(a).toMatchObject({ correct: 1, total: 2, accuracy: 50 });
    expect(r.find((s) => s.id === "B")).toMatchObject({
      correct: 1,
      total: 1,
      accuracy: 100,
    });
  });

  it("T-003 AC2 order 昇順で返し、回答済みがない科目は含まない", () => {
    const r = summarizeBySubject([prog("q1", 100), prog("q2", 0)], quizzes);
    expect(r.map((s) => s.id)).toEqual(["A", "B"]);
  });

  it("T-003 AC3 weakQuizIds は 100 でない回答済み問題（null 含む）だけ", () => {
    const r = summarizeBySubject(
      [prog("q2", 100), prog("q3", null)],
      quizzes
    );
    expect(r[0].weakQuizIds).toEqual(["q3"]);
    const r2 = summarizeBySubject([prog("q2", 100), prog("q3", 80)], quizzes);
    expect(r2[0].weakQuizIds).toEqual(["q3"]);
    expect(
      summarizeBySubject([prog("q2", 100)], quizzes)[0].weakQuizIds
    ).toEqual([]);
  });

  it("T-003 AC4 attemptCount 0 と未知の targetId は集計しない", () => {
    const r = summarizeBySubject(
      [prog("q2", 100, 0), prog("zzz", 100), prog("q3", 100)],
      quizzes
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ id: "A", correct: 1, total: 1 });
  });
});

describe("summarizeOverall", () => {
  it("T-003 AC5 進捗0件なら accuracy は 0（NaN にならない）", () => {
    expect(summarizeOverall([])).toEqual({
      answeredCount: 0,
      correctCount: 0,
      accuracy: 0,
      totalAttempts: 0,
    });
  });

  it("T-003 AC5 正答率と totalAttempts を計算する", () => {
    const r = summarizeOverall([
      prog("q1", 100, 3),
      prog("q2", 0, 2),
      prog("q3", null, 0),
      prog("q4", 100, 1),
    ]);
    expect(r.answeredCount).toBe(3);
    expect(r.correctCount).toBe(2);
    expect(r.accuracy).toBeCloseTo(66.666, 2);
    expect(r.totalAttempts).toBe(6);
  });
});

describe("ページでの利用", () => {
  it("T-003 AC6 両ページは progress-stats を使い Map 集計を持たない", async () => {
    const { readFileSync } = await import("node:fs");
    for (const f of ["src/app/stats/page.tsx", "src/app/weakness/page.tsx"]) {
      const src = readFileSync(f, "utf8");
      expect(src).toContain("@/lib/progress-stats");
      expect(src).not.toContain("subjectStats");
    }
  });
});
