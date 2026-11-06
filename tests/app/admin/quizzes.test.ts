import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { quiz: { create } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createQuiz } from "@/app/admin/quizzes/actions";

const base = {
  articleId: "a1",
  question: "q",
  quizType: "MULTIPLE_CHOICE" as const,
  phase: "UNDERSTAND" as const,
  answer: "A",
  choices: ["A", "B"],
  explanation: null,
  order: 0,
};

describe("createQuiz", () => {
  beforeEach(() => {
    create.mockReset();
    create.mockResolvedValue({});
  });

  it("T-011 AC3 検証エラーなら保存せず success:false を返す", async () => {
    const r = await createQuiz({ ...base, choiceExplanations: ["x"] });
    expect(r.success).toBe(false);
    expect(create).not.toHaveBeenCalled();
    const r2 = await createQuiz({ ...base, basisYear: 1800 });
    expect(r2.success).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("T-011 AC4 解説・根拠・基準年度を保存し、basis の空文字は null にする", async () => {
    await createQuiz({
      ...base,
      choiceExplanations: ["a", "b"],
      basis: "条文",
      basisYear: 2025,
    });
    expect(create.mock.calls[0][0].data).toMatchObject({
      choiceExplanations: ["a", "b"],
      basis: "条文",
      basisYear: 2025,
    });
    await createQuiz({ ...base, basis: "" });
    expect(create.mock.calls[1][0].data).toMatchObject({
      choiceExplanations: [],
      basis: null,
      basisYear: null,
    });
  });
});

describe("quiz-form", () => {
  it("T-011 AC5 解説欄・根拠欄・基準年度欄があり createQuiz に渡している", () => {
    const src = readFileSync("src/app/admin/quizzes/quiz-form.tsx", "utf8");
    expect(src).toContain("の解説");
    expect(src).toContain('id="basis"');
    expect(src).toContain('id="basisYear"');
    expect(src).toMatch(/choiceExplanations:\s*compacted\.choiceExplanations/);
    expect(src).toMatch(/\bbasis:/);
    expect(src).toMatch(/\bbasisYear:/);
    expect(src).toContain("compactChoices(");
  });
});
