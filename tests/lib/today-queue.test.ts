import { describe, expect, it } from "vitest";
import { buildTodayQueue } from "@/lib/today-queue";

const now = new Date("2026-01-10T00:00:00Z");
const d = (s: string) => new Date(s);
const pr = (targetId: string, nextReviewAt: Date | null, score: number | null = 100, attemptCount = 1) => ({
  targetId,
  nextReviewAt,
  attemptCount,
  score,
});
const ids = (r: { quizId: string }[]) => r.map((x) => x.quizId);

describe("buildTodayQueue", () => {
  it("T-008 AC1 due → weak → new の順に並ぶ", () => {
    const quizzes = [
      { id: "n", topicId: null },
      { id: "w", topicId: "T1" },
      { id: "d", topicId: null },
      { id: "wa", topicId: "T1" },
    ];
    const progress = [pr("d", d("2026-01-01T00:00:00Z")), pr("wa", d("2026-02-01T00:00:00Z"), 0)];
    expect(buildTodayQueue({ quizzes, progress, now })).toEqual([
      { quizId: "d", reason: "due" },
      { quizId: "w", reason: "weak" },
      { quizId: "wa", reason: "weak" },
      { quizId: "n", reason: "new" },
    ]);
  });

  it("T-008 AC2 due は古い順、null が先頭、now と同時刻は含み、後は含まない", () => {
    const quizzes = ["a", "b", "c", "e", "f"].map((id) => ({ id, topicId: null }));
    const progress = [
      pr("a", d("2026-01-05T00:00:00Z")),
      pr("b", null),
      pr("c", now),
      pr("e", new Date(now.getTime() + 1)),
      pr("f", d("2026-01-05T00:00:00Z")),
    ];
    expect(buildTodayQueue({ quizzes, progress, now })).toEqual([
      { quizId: "b", reason: "due" },
      { quizId: "a", reason: "due" },
      { quizId: "f", reason: "due" },
      { quizId: "c", reason: "due" },
    ]);
  });

  it("T-008 AC3 正答率の低い論点が先、ちょうど閾値は弱点にならない", () => {
    const future = d("2027-01-01T00:00:00Z");
    const quizzes = [
      { id: "a1", topicId: "A" }, // A: 2/3 correct no, set below
      { id: "b1", topicId: "B" },
      { id: "b2", topicId: "B" },
      { id: "c1", topicId: "C" },
      { id: "c2", topicId: "C" },
      { id: "c3", topicId: "C" },
      { id: "c4", topicId: "C" },
      { id: "c5", topicId: "C" },
      { id: "u", topicId: "B" },
    ];
    const progress = [
      pr("a1", future, 0), // A 0%
      pr("b1", future, 100),
      pr("b2", future, 0), // B 50%
      pr("c1", future, 100),
      pr("c2", future, 100),
      pr("c3", future, 100),
      pr("c4", future, 0),
      pr("c5", future, 0), // C 60% = 閾値ちょうど
    ];
    const r = buildTodayQueue({ quizzes, progress, now });
    expect(r).toEqual([
      { quizId: "a1", reason: "weak" },
      { quizId: "b1", reason: "weak" },
      { quizId: "b2", reason: "weak" },
      { quizId: "u", reason: "weak" },
    ]);
  });

  it("T-008 AC4 回答済み0件の論点と topicId null は weak にならず new", () => {
    const quizzes = [
      { id: "x", topicId: "Z" },
      { id: "y", topicId: null },
    ];
    expect(buildTodayQueue({ quizzes, progress: [], now })).toEqual([
      { quizId: "x", reason: "new" },
      { quizId: "y", reason: "new" },
    ]);
  });

  it("T-008 AC5 弱点でない期限前の回答済みは含まれない", () => {
    const quizzes = [{ id: "a", topicId: "A" }, { id: "b", topicId: null }];
    const progress = [pr("a", d("2027-01-01T00:00:00Z"), 100), pr("b", d("2027-01-01T00:00:00Z"), 0)];
    expect(buildTodayQueue({ quizzes, progress, now })).toEqual([]);
  });

  it("T-008 AC6 重複なし・limit で切る・quizzes にない進捗は無視", () => {
    const quizzes = [
      { id: "a", topicId: null },
      { id: "a", topicId: null },
      { id: "b", topicId: null },
      { id: "c", topicId: null },
    ];
    const progress = [pr("ghost", null), pr("a", null)];
    const r = buildTodayQueue({ quizzes, progress, now, limit: 2 });
    expect(r).toEqual([
      { quizId: "a", reason: "due" },
      { quizId: "b", reason: "new" },
    ]);
    expect(ids(buildTodayQueue({ quizzes, progress, now }))).toEqual(["a", "b", "c"]);
  });

  it("T-008 AC7 同じ入力なら同じ結果", () => {
    const quizzes = [{ id: "a", topicId: "A" }, { id: "b", topicId: "A" }];
    const progress = [pr("a", d("2027-01-01T00:00:00Z"), 0)];
    expect(buildTodayQueue({ quizzes, progress, now })).toEqual(
      buildTodayQueue({ quizzes, progress, now }),
    );
  });
});
