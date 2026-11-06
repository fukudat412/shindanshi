export type TodayQueueReason = "due" | "weak" | "new";

export type TodayQueueQuiz = { id: string; topicId: string | null };

export type TodayQueueProgress = {
  targetId: string;
  nextReviewAt: Date | null;
  attemptCount: number;
  score: number | null;
};

export type TodayQueueItem = { quizId: string; reason: TodayQueueReason };

/**
 * 今日のキュー: 期限切れ → 弱点論点 → 未出題 の順に並べる純粋関数。
 */
export function buildTodayQueue({
  quizzes,
  progress,
  now,
  limit = 20,
  weakThreshold = 60,
}: {
  quizzes: TodayQueueQuiz[];
  progress: TodayQueueProgress[];
  now: Date;
  limit?: number;
  weakThreshold?: number;
}): TodayQueueItem[] {
  // 同じ id は最初の出現だけ使う
  const seen = new Set<string>();
  const list = quizzes.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });

  const progressById = new Map<string, TodayQueueProgress>();
  for (const p of progress) {
    if (!progressById.has(p.targetId)) progressById.set(p.targetId, p);
  }
  const answeredOf = (id: string) => {
    const p = progressById.get(id);
    return p && p.attemptCount > 0 ? p : undefined;
  };

  // (1) due
  const nowMs = now.getTime();
  const due = list
    .map((q, index) => ({ q, index, p: answeredOf(q.id) }))
    .filter(
      (x) => x.p && (x.p.nextReviewAt === null || x.p.nextReviewAt.getTime() <= nowMs),
    )
    .sort((a, b) => {
      const at = a.p!.nextReviewAt?.getTime() ?? -Infinity;
      const bt = b.p!.nextReviewAt?.getTime() ?? -Infinity;
      if (at !== bt) return at < bt ? -1 : 1;
      return a.index - b.index;
    })
    .map((x) => x.q);
  const dueIds = new Set(due.map((q) => q.id));

  // 論点ごとの正答率
  const stats = new Map<string, { answered: number; correct: number; order: number }>();
  list.forEach((q) => {
    if (q.topicId === null) return;
    let s = stats.get(q.topicId);
    if (!s) {
      s = { answered: 0, correct: 0, order: stats.size };
      stats.set(q.topicId, s);
    }
    const p = answeredOf(q.id);
    if (p) {
      s.answered += 1;
      if (p.score === 100) s.correct += 1;
    }
  });
  const weakTopics = [...stats.entries()]
    .filter(([, s]) => s.answered > 0 && (s.correct / s.answered) * 100 < weakThreshold)
    .sort(([, a], [, b]) => {
      const ra = a.correct / a.answered;
      const rb = b.correct / b.answered;
      if (ra !== rb) return ra - rb;
      return a.order - b.order;
    })
    .map(([topicId]) => topicId);

  const weak: TodayQueueQuiz[] = [];
  for (const topicId of weakTopics) {
    for (const q of list) {
      if (q.topicId === topicId && !dueIds.has(q.id)) weak.push(q);
    }
  }
  const weakIds = new Set(weak.map((q) => q.id));

  // (3) new
  const fresh = list.filter(
    (q) => !dueIds.has(q.id) && !weakIds.has(q.id) && !answeredOf(q.id),
  );

  return [
    ...due.map((q) => ({ quizId: q.id, reason: "due" as const })),
    ...weak.map((q) => ({ quizId: q.id, reason: "weak" as const })),
    ...fresh.map((q) => ({ quizId: q.id, reason: "new" as const })),
  ].slice(0, Math.max(0, limit));
}
