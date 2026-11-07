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

describe("importPastExams の図", () => {
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
    0, 0, 0, 4, 0, 0, 0, 3, 8, 0, 0, 0, 0,
  ]).toString("base64");

  it("新規は図を入力の順に作り、更新は既存の図を消してから作り直す", async () => {
    m.quizFindMany.mockResolvedValue([
      { id: "q1", examYear: 2023, examQuestionNumber: 3, examSubQuestionNumber: null, article: { subjectId: "s1" } },
    ]);
    await run([
      { ...base, images: [png] },
      { ...base, examQuestionNumber: 4, images: [png, png] },
    ]);
    const created = m.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(created.data.subjectId).toBeUndefined();
    expect(created.data.images).toEqual({
      create: [
        expect.objectContaining({ order: 0, width: 4, height: 3 }),
        expect.objectContaining({ order: 1, width: 4, height: 3 }),
      ],
    });
    const updated = m.update.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(updated.data.images).toEqual({
      deleteMany: {},
      create: [expect.objectContaining({ order: 0, width: 4, height: 3 })],
    });
  });

  it("images がなければ、更新時に既存の図を消す", async () => {
    m.quizFindMany.mockResolvedValue([
      { id: "q1", examYear: 2023, examQuestionNumber: 3, examSubQuestionNumber: null, article: { subjectId: "s1" } },
    ]);
    await run([base]);
    const updated = m.update.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(updated.data.images).toEqual({ deleteMany: {}, create: [] });
  });
});

describe("管理画面メニュー", () => {
  it("T-015 AC6 admin/page.tsx に /admin/import がある", () => {
    expect(readFileSync("src/app/admin/page.tsx", "utf8")).toContain('href: "/admin/import"');
  });
});
