import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { quiz: { update } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateQuizVerificationStatus } from "@/app/admin/quizzes/actions";

describe("updateQuizVerificationStatus", () => {
  beforeEach(() => {
    update.mockReset();
    update.mockResolvedValue({});
  });

  it("T-019 AC3 不正な status なら更新せず success:false", async () => {
    const r = await updateQuizVerificationStatus("q1", "verified");
    expect(r.success).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("T-019 AC4 正しい status なら verificationStatus だけ更新する", async () => {
    const r = await updateQuizVerificationStatus("q1", "NEEDS_FIX");
    expect(r.success).toBe(true);
    expect(update).toHaveBeenCalledWith({
      where: { id: "q1" },
      data: { verificationStatus: "NEEDS_FIX" },
    });
  });

  it("T-019 AC5 page.tsx は status を解釈して絞り込み、各行に表示と操作がある", () => {
    const page = readFileSync("src/app/admin/quizzes/page.tsx", "utf8");
    expect(page).toContain("parseVerificationStatus(status)");
    expect(page).toMatch(/verificationStatus[^]*findMany|findMany[^]*verificationStatus/);
    expect(page).toContain("verificationStatusLabel(quiz.verificationStatus)");
    expect(page).toContain("<VerificationStatusButtons");
    const btn = readFileSync(
      "src/app/admin/quizzes/verification-status-buttons.tsx",
      "utf8",
    );
    expect(btn).toContain("updateQuizVerificationStatus");
  });
});
