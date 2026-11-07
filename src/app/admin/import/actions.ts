"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  parsePastExamImport,
  planPastExamUpsert,
  type PastExamImportError,
  type PastExamImportItem,
} from "@/lib/past-exam-import";

export type ImportPastExamsResult =
  | { ok: true; created: number; updated: number }
  | { ok: false; errors: PastExamImportError[] };

// 取り込み項目を quiz の data にする。図は入力の順に作り直す（更新時は既存の図を消してから作る）
const toData = ({ ...item }: PastExamImportItem & { subjectId?: string }) => {
  delete item.subjectId;
  const { images, ...rest } = item;
  return {
    ...rest,
    images: { create: images.map((image, order) => ({ order, ...image })) },
  };
};

export async function importPastExams(text: string): Promise<ImportPastExamsResult> {
  const parsed = parsePastExamImport(text);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  // articleId から科目を引く
  const articleIds = [...new Set(parsed.items.map((i) => i.articleId))];
  const articles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
    select: { id: true, subjectId: true },
  });
  const subjectByArticle = new Map(articles.map((a) => [a.id, a.subjectId]));

  const missing: PastExamImportError[] = [];
  parsed.items.forEach((item, index) => {
    if (!subjectByArticle.has(item.articleId)) {
      missing.push({ index, message: `articleId ${item.articleId} の記事が存在しません` });
    }
  });
  if (missing.length > 0) return { ok: false, errors: missing };

  const items = parsed.items.map((item) => ({
    ...item,
    subjectId: subjectByArticle.get(item.articleId) as string,
  }));

  const rows = await prisma.quiz.findMany({
    where: { origin: "PAST_EXAM" },
    select: {
      id: true,
      examYear: true,
      examQuestionNumber: true,
      examSubQuestionNumber: true,
      article: { select: { subjectId: true } },
    },
  });
  const existing = rows.map((r) => ({
    id: r.id,
    subjectId: r.article.subjectId,
    examYear: r.examYear,
    examQuestionNumber: r.examQuestionNumber,
    examSubQuestionNumber: r.examSubQuestionNumber,
  }));

  const plan = planPastExamUpsert(items, existing);
  if (plan.duplicateIndexes.length > 0) {
    return {
      ok: false,
      errors: plan.duplicateIndexes.map((index) => ({
        index,
        message: "同じ科目・年度・問番号・設問番号の問題が入力内に複数あります",
      })),
    };
  }

  await prisma.$transaction([
    ...plan.creates.map((item) => prisma.quiz.create({ data: toData(item) })),
    ...plan.updates.map(({ id, item }) => {
      const data = toData(item);
      return prisma.quiz.update({
        where: { id },
        data: { ...data, images: { deleteMany: {}, ...data.images } },
      });
    }),
  ]);

  revalidatePath("/admin/quizzes");
  return { ok: true, created: plan.creates.length, updated: plan.updates.length };
}
