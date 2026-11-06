import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VerificationStatus } from "@/generated/prisma/enums";
import { isServableQuiz, servableQuizWhere } from "@/lib/quiz-eligibility";

const statuses = ["DRAFT", "VERIFIED", "NEEDS_FIX", "REJECTED"] as const;

describe("quiz-eligibility", () => {
  it("T-017 AC1 VerificationStatus は4値のみで、Quiz に verificationStatus があり既定は DRAFT", () => {
    expect(Object.values(VerificationStatus).sort()).toEqual([...statuses].sort());
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const enumBody = /enum VerificationStatus \{([^}]*)\}/.exec(schema)?.[1] ?? "";
    expect(enumBody.trim().split(/\s+/).sort()).toEqual([...statuses].sort());
    expect(schema).toMatch(
      /verificationStatus\s+VerificationStatus\s+@default\(DRAFT\)\s+@map\("verification_status"\)/,
    );
  });

  it("T-017 AC2 類題は VERIFIED のときだけ出題できる", () => {
    for (const verificationStatus of statuses) {
      expect(isServableQuiz({ origin: "SIMILAR", verificationStatus })).toBe(
        verificationStatus === "VERIFIED",
      );
    }
  });

  it("T-017 AC3 過去問は検証状態にかかわらず出題できる", () => {
    for (const verificationStatus of statuses) {
      expect(isServableQuiz({ origin: "PAST_EXAM", verificationStatus })).toBe(true);
    }
  });

  it("T-017 AC4 servableQuizWhere は VERIFIED または PAST_EXAM", () => {
    expect(servableQuizWhere).toEqual({
      OR: [{ verificationStatus: "VERIFIED" }, { origin: "PAST_EXAM" }],
    });
  });
});
