import { describe, expect, it } from "vitest";
import {
  choiceLabel,
  choiceTextAfterLabel,
  pastExamTimeLimit,
  planPastExamSets,
} from "@/lib/past-exam-sets";

const subjects = [
  { id: "A", name: "経済学・経済政策", order: 1 },
  { id: "C", name: "企業経営理論", order: 3 },
  { id: "G", name: "中小企業経営・政策", order: 7 },
];
const q = (id: string, subjectId: string, examYear: number, n: number, sub: number | null = null) => ({
  id,
  subjectId,
  examYear,
  examQuestionNumber: n,
  examSubQuestionNumber: sub,
});

describe("planPastExamSets", () => {
  it("年度・科目ごとにまとめ、問題番号・設問番号の順に並べる", () => {
    const plans = planPastExamSets(
      [q("a3", "A", 2024, 3), q("a1-2", "A", 2024, 1, 2), q("a1-1", "A", 2024, 1, 1), q("a2", "A", 2024, 2)],
      subjects,
    );
    expect(plans).toEqual([
      {
        year: 2024,
        subjectId: "A",
        name: "令和6年度 第1次試験 経済学・経済政策",
        timeLimit: 60,
        quizIds: ["a1-1", "a1-2", "a2", "a3"],
      },
    ]);
  });

  it("新しい年度が先、同じ年度は科目の順。90 分の科目は 90 分", () => {
    const plans = planPastExamSets(
      [q("g", "G", 2023, 1), q("a", "A", 2023, 1), q("c", "C", 2024, 1)],
      subjects,
    );
    expect(plans.map((p) => [p.year, p.subjectId, p.timeLimit])).toEqual([
      [2024, "C", 90],
      [2023, "A", 60],
      [2023, "G", 90],
    ]);
  });

  it("科目が見つからない問題は入れない", () => {
    expect(planPastExamSets([q("x", "Z", 2024, 1)], subjects)).toEqual([]);
  });
});

describe("pastExamTimeLimit・choiceLabel", () => {
  it("試験時間は企業経営理論・運営管理・中小企業経営・政策が 90 分、ほかは 60 分", () => {
    expect(pastExamTimeLimit("運営管理")).toBe(90);
    expect(pastExamTimeLimit("財務・会計")).toBe(60);
  });

  it("選択肢の記号はア〜コ、それより後は数字", () => {
    expect([0, 1, 4].map(choiceLabel)).toEqual(["ア", "イ", "オ"]);
    expect(choiceLabel(10)).toBe("11");
  });

  it("選択肢が記号だけ（図の選択肢）なら本文を出さず、それ以外は本文を出す", () => {
    expect(choiceTextAfterLabel("ウ", 2)).toBeNull();
    expect(choiceTextAfterLabel("ア", 2)).toBe("ア");
    expect(choiceTextAfterLabel("需要が増える", 0)).toBe("需要が増える");
  });
});
