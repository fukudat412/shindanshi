import { formatJapaneseFiscalYear } from "@/lib/past-exam";

// 1 次試験の科目ごとの試験時間（分）。ここにない科目は 60 分
const EXAM_MINUTES: Record<string, number> = {
  企業経営理論: 90,
  運営管理: 90,
  "中小企業経営・政策": 90,
};

export function pastExamTimeLimit(subjectName: string): number {
  return EXAM_MINUTES[subjectName] ?? 60;
}

export type PastExamSetQuiz = {
  id: string;
  subjectId: string;
  examYear: number;
  examQuestionNumber: number;
  examSubQuestionNumber: number | null;
};

export type PastExamSetPlan = {
  year: number;
  subjectId: string;
  name: string;
  timeLimit: number;
  quizIds: string[];
};

/** 過去問を年度・科目ごとにまとめ、問題番号・設問番号の順に並べた年度別セットの案を返す */
export function planPastExamSets(
  quizzes: PastExamSetQuiz[],
  subjects: { id: string; name: string; order: number }[],
): PastExamSetPlan[] {
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const groups = new Map<string, PastExamSetQuiz[]>();
  for (const quiz of quizzes) {
    if (!subjectById.has(quiz.subjectId)) continue;
    const key = `${quiz.examYear}:${quiz.subjectId}`;
    const group = groups.get(key) ?? [];
    group.push(quiz);
    groups.set(key, group);
  }

  const plans: PastExamSetPlan[] = [...groups.values()].map((group) => {
    const { examYear, subjectId } = group[0];
    const subject = subjectById.get(subjectId)!;
    const sorted = [...group].sort(
      (a, b) =>
        a.examQuestionNumber - b.examQuestionNumber ||
        (a.examSubQuestionNumber ?? 0) - (b.examSubQuestionNumber ?? 0),
    );
    return {
      year: examYear,
      subjectId,
      name: `${formatJapaneseFiscalYear(examYear)} 第1次試験 ${subject.name}`,
      timeLimit: pastExamTimeLimit(subject.name),
      quizIds: sorted.map((q) => q.id),
    };
  });

  const subjectOrder = (plan: PastExamSetPlan) => subjectById.get(plan.subjectId)!.order;
  return plans.sort((a, b) => b.year - a.year || subjectOrder(a) - subjectOrder(b));
}

// 選択肢の記号（並べ替えずに元の順で出す画面用）。ア〜コを超えたら数字
const CHOICE_LABELS = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ"];

export function choiceLabel(index: number): string {
  return CHOICE_LABELS[index] ?? String(index + 1);
}
