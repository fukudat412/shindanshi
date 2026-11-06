import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { shuffle } from "@/lib/shuffle";

const sequence = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("shuffle", () => {
  it("T-002 AC1 元の配列を変更せず新しい配列を返す", () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle(original, sequence([0, 0.5, 0.9, 0.1]));
    expect(original).toEqual([1, 2, 3, 4, 5]);
    expect(result).not.toBe(original);
  });

  it("T-002 AC2 同じ要素を同じ個数だけ含む", () => {
    const original = [1, 2, 2, 3, 3, 3];
    const result = shuffle(original, sequence([0.3, 0.7, 0.1, 0.9]));
    expect(result).toHaveLength(original.length);
    expect([...result].sort()).toEqual([...original].sort());
  });

  it("T-002 AC3 同じ乱数列なら同じ並び順になる", () => {
    const items = ["a", "b", "c", "d", "e", "f"];
    const values = [0.12, 0.85, 0.5, 0.33, 0.99];
    expect(shuffle(items, sequence(values))).toEqual(
      shuffle(items, sequence(values)),
    );
  });

  it("T-002 AC4 空配列・1要素はそのまま同じ内容を返す", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([42])).toEqual([42]);
  });

  it("T-002 AC5 mock-exam/actions.ts は共通の shuffle を import している", () => {
    const src = readFileSync("src/app/mock-exam/actions.ts", "utf8");
    expect(src).not.toMatch(/function shuffle/);
    expect(src).toMatch(/import \{ shuffle \} from "@\/lib\/shuffle"/);
  });
});
