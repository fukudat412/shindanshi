import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDueReviews } from "@/lib/due-review";
import { isServableQuiz } from "@/lib/quiz-eligibility";

const read = (p: string) => readFileSync(p, "utf8");

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

describe("servable quiz filter", () => {
  it("T-018 AC1 quiz/page.tsx の articleId 指定と quizId 指定", () => {
    const src = read("src/app/quiz/page.tsx");
    expect(src).toMatch(/findFirst\(\{\s*where: \{ AND: \[\{ id: quizId \}, servableQuizWhere\] \}/);
    expect(src).toContain("where: { AND: [{ articleId }, servableQuizWhere] }");
  });

  it("T-018 AC2 practice/page.tsx の通常・弱点・科目別の数", () => {
    const src = read("src/app/practice/page.tsx");
    expect(src).toContain("quizzes: { where: servableQuizWhere }");
    expect(src).toMatch(/id: \{ in: weakQuizIds \},[\s\S]*?\},\s*servableQuizWhere,/);
    expect(src).toContain("subjectId: { in: subjectIds } } }, servableQuizWhere]");
  });

  it("T-018 AC3 createMockExam の取得条件", () => {
    const src = read("src/app/mock-exam/actions.ts");
    expect(src).toContain("subjectId: { in: subjectIds } } }, servableQuizWhere]");
  });

  it("T-018 AC4 today/page.tsx の出題候補", () => {
    expect(read("src/app/today/page.tsx")).toMatch(
      /prisma\.quiz\.findMany\(\{\s*where: servableQuizWhere,/,
    );
  });

  it("T-018 AC5 復習リストと復習待ち件数は対象外を数えない", async () => {
    // 8件の復習待ち。q3 だけ DRAFT の創作問題（対象外）
    const progress = Array.from({ length: 8 }, (_, i) => ({
      targetId: `q${i + 1}`,
      nextReviewAt: new Date(2026, 0, i + 1),
    }));
    const quizzes = progress.map((p, i) => ({
      id: p.targetId,
      origin: i === 2 ? "ORIGINAL" : "PAST_EXAM",
      verificationStatus: "DRAFT",
    }));
    const db = {
      userProgress: { findMany: async () => progress },
      quiz: {
        // where の AND に servableQuizWhere が入っていることを前提に、同条件で絞る
        findMany: async (args: { where: { AND: unknown[] } }) => {
          expect(JSON.stringify(args.where.AND)).toContain("PAST_EXAM");
          return quizzes.filter((q) =>
            isServableQuiz(q as Parameters<typeof isServableQuiz>[0]),
          );
        },
      },
    };
    const { dueQuizzes, dueCount } = await getDueReviews(
      "u1",
      new Date(2026, 5, 1),
      5,
      db as unknown as Parameters<typeof getDueReviews>[3],
    );
    expect(dueCount).toBe(7);
    expect(dueQuizzes.map((d) => d.targetId)).toEqual(["q1", "q2", "q4", "q5", "q6"]);

    // ホームは件数から表示を作る: 対象外込み(8)なら「あと3件」、除くと「あと2件」
    const label = dueCount > 5 ? `(あと${dueCount - 5}件)` : "";
    expect(label).toBe("(あと2件)");
    expect(label).not.toBe("(あと3件)");
    const home = read("src/app/page.tsx");
    expect(home).toContain("getDueReviews(userId)");
    expect(home).toContain("{dueCount > 5 && ` (あと${dueCount - 5}件)`}");
  });

  it("T-018 AC6 exams 配下では servableQuizWhere を使わない", () => {
    const files = listFiles("src/app/exams");
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) expect(read(f)).not.toContain("servableQuizWhere");
  });
});
