import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { judgeAnswer } from "@/lib/answer-judge";
import { shuffleChoicesForDisplay } from "@/lib/quiz-display";

const mc = {
  quizType: "MULTIPLE_CHOICE" as const,
  answer: "Beta",
  choices: ["Alpha", "Beta", "Gamma", "Delta"],
};
const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("shuffleChoicesForDisplay", () => {
  it("T-007 AC1 同じ random なら同じ順で、要素と個数は元と同じ", () => {
    const a = shuffleChoicesForDisplay(mc, seq([0, 0.5, 0.2]));
    const b = shuffleChoicesForDisplay(mc, seq([0, 0.5, 0.2]));
    expect(a.choices).toEqual(b.choices);
    expect(a.choices).not.toEqual(mc.choices);
    expect([...a.choices].sort()).toEqual([...mc.choices].sort());
  });

  it("T-007 AC2 MULTIPLE_CHOICE 以外は同じ内容を返し、引数は変更しない", () => {
    const tf = { quizType: "TRUE_FALSE" as const, answer: "true", choices: ["x", "y"] };
    expect(shuffleChoicesForDisplay(tf, seq([0]))).toEqual(tf);
    const snapshot = structuredClone(mc);
    const choicesRef = mc.choices;
    shuffleChoicesForDisplay(mc, seq([0]));
    expect(mc).toEqual(snapshot);
    expect(mc.choices).toBe(choicesRef);
  });

  it("T-007 AC3 並べ替え後も judgeAnswer は answer と同じ値だけ正解にする", () => {
    const s = shuffleChoicesForDisplay(mc, seq([0, 0.5, 0.2]));
    for (const c of s.choices) {
      expect(judgeAnswer(s, c)).toBe(judgeAnswer(mc, c));
      expect(judgeAnswer(s, c)).toBe(c === "Beta");
    }
  });

  it("T-007 AC4 quiz/practice の page は shuffleChoicesForDisplay を通している", () => {
    for (const f of ["src/app/quiz/page.tsx", "src/app/practice/page.tsx"]) {
      const src = readFileSync(f, "utf8");
      expect(src).toContain('import { shuffleChoicesForDisplay } from "@/lib/quiz-display"');
      expect(src).toMatch(/shuffleChoicesForDisplay\(/);
    }
  });

  it("T-007 AC5 practice は sort(() => Math.random() - 0.5) を使わず shuffle で決める", () => {
    const src = readFileSync("src/app/practice/page.tsx", "utf8");
    expect(src).not.toMatch(/Math\.random\(\)\s*-\s*0\.5/);
    expect(src).toContain('from "@/lib/shuffle"');
  });
});
