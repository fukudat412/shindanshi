export type ProgressInput = {
  targetId: string;
  score: number | null;
  attemptCount: number;
};

export type QuizInput = {
  id: string;
  article: { subject: { id: string; name: string; order: number } };
};

export type SubjectSummary = {
  id: string;
  name: string;
  order: number;
  correct: number;
  total: number;
  accuracy: number;
  weakQuizIds: string[];
};

export type OverallSummary = {
  answeredCount: number;
  correctCount: number;
  accuracy: number;
  totalAttempts: number;
};

const isCorrect = (p: ProgressInput) => p.score === 100;

/** 科目別の正解数・回答数・正答率を数える（回答済みの進捗だけが対象） */
export function summarizeBySubject(
  progress: ProgressInput[],
  quizzes: QuizInput[]
): SubjectSummary[] {
  const answered = new Map<string, ProgressInput>();
  for (const p of progress) {
    if (p.attemptCount > 0) answered.set(p.targetId, p);
  }

  const bySubject = new Map<string, SubjectSummary>();
  for (const quiz of quizzes) {
    const p = answered.get(quiz.id);
    if (!p) continue;
    const { id, name, order } = quiz.article.subject;
    let stats = bySubject.get(id);
    if (!stats) {
      stats = { id, name, order, correct: 0, total: 0, accuracy: 0, weakQuizIds: [] };
      bySubject.set(id, stats);
    }
    stats.total++;
    if (isCorrect(p)) stats.correct++;
    else stats.weakQuizIds.push(quiz.id);
  }

  return Array.from(bySubject.values())
    .map((s) => ({ ...s, accuracy: (s.correct / s.total) * 100 }))
    .sort((a, b) => a.order - b.order);
}

/** 全体の回答済み問題数・正解数・正答率・総回答回数 */
export function summarizeOverall(progress: ProgressInput[]): OverallSummary {
  const answered = progress.filter((p) => p.attemptCount > 0);
  const correctCount = answered.filter(isCorrect).length;
  return {
    answeredCount: answered.length,
    correctCount,
    accuracy:
      answered.length > 0 ? (correctCount / answered.length) * 100 : 0,
    totalAttempts: progress.reduce((acc, p) => acc + p.attemptCount, 0),
  };
}
