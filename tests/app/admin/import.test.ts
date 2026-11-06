import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  articleFindMany: vi.fn(),
  quizFindMany: vi.fn(),
  create: vi.fn((a: unknown) => ({ op: "create", a })),
  update: vi.fn((a: unknown) => ({ op: "update", a })),
  transaction: vi.fn(async () => []),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: { findMany: m.articleFindMany },
    quiz: { findMany: m.quizFindMany, create: m.create, update: m.update },
    $transaction: m.transaction,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { importPastExams } from "@/app/admin/import/actions";

const base = {
  articleId: "a1",
  examYear: 2023,
  examQuestionNumber: 3,
  question: "Q",
  quizType: "TRUE_FALSE",
  answer: "true",
};
const run = (arr: unknown[]) => importPastExams(JSON.stringify(arr));

beforeEach(() => {
  vi.clearAllMocks();
  m.articleFindMany.mockResolvedValue([{ id: "a1", subjectId: "s1" }]);
  m.quizFindMany.mockResolvedValue([]);
});

describe("importPastExams", () => {
  it("T-015 AC4 解析エラーなら何も書かずエラーを返す", async () => {
    const r = await run([{ ...base, answer: "x" }]);
    expect(r.ok).toBe(false);
    expect(m.create).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it("T-015 AC4 存在しない articleId は index 付きエラーで、何も書かない", async () => {
    const r = await run([base, { ...base, articleId: "zzz", examQuestionNumber: 4 }]);
    expect(r).toEqual({ ok: false, errors: [{ index: 1, message: expect.any(String) }] });
    expect(m.create).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
  });

  it("T-015 AC4 入力内の重複は何も書かずエラーを返す", async () => {
    const r = await run([base, base]);
    expect(r.ok).toBe(false);
    expect(m.create).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
  });

  it("T-015 AC5 作成と更新を行い、件数を返す", async () => {
    m.quizFindMany.mockResolvedValue([
      { id: "q1", examYear: 2023, examQuestionNumber: 3, examSubQuestionNumber: null, article: { subjectId: "s1" } },
    ]);
    const r = await run([base, { ...base, examQuestionNumber: 4 }]);
    expect(r).toEqual({ ok: true, created: 1, updated: 1 });
    expect(m.create).toHaveBeenCalledTimes(1);
    expect(m.update).toHaveBeenCalledTimes(1);
    expect(m.update.mock.calls[0][0]).toMatchObject({ where: { id: "q1" } });
    expect(m.transaction).toHaveBeenCalledTimes(1);
  });
});

describe("管理画面メニュー", () => {
  it("T-015 AC6 admin/page.tsx に /admin/import がある", () => {
    expect(readFileSync("src/app/admin/page.tsx", "utf8")).toContain('href: "/admin/import"');
  });
});
