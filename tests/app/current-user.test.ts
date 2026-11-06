import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(p, "utf8");

describe("進捗を読み書きするファイルは同じユーザーを使う", () => {
  const files = [
    "src/app/page.tsx",
    "src/app/stats/page.tsx",
    "src/app/weakness/page.tsx",
    "src/app/subjects/[id]/page.tsx",
    "src/app/articles/[id]/actions.ts",
  ];

  it.each(files)('T-005 AC2 %s に "default-user" が残らず getCurrentUserId を使う', (f) => {
    const src = read(f);
    expect(src).not.toContain("default-user");
    expect(src).toMatch(/import \{[^}]*getCurrentUserId[^}]*\} from "@\/lib\/user-utils"/);
    expect(src).toContain("await getCurrentUserId()");
  });

  it("T-005 AC3 saveQuizResult は getCurrentUserId でユーザーを決める", () => {
    const src = read("src/app/quiz/actions.ts");
    expect(src).toContain("await getCurrentUserId()");
    expect(src).not.toContain("getOrCreateGuestUser");
  });

  it.each(["src/app/practice/page.tsx", "src/app/mock-exam/actions.ts"])(
    "T-005 AC4 %s はゲスト取得を定義せず user-utils から import する",
    (f) => {
      const src = read(f);
      expect(src).not.toMatch(/function\s+(getOrCreateGuestUser|getCurrentUserId)\b/);
      expect(src).toMatch(/import \{[^}]*getCurrentUserId[^}]*\} from "@\/lib\/user-utils"/);
    }
  );
});
