import { describe, expect, it } from "vitest";
import { decodeBase64Png, MAX_QUIZ_IMAGE_BYTES, readPngSize } from "@/lib/quiz-image";

const header = (width: number, height: number) => {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
};

describe("readPngSize", () => {
  it("IHDR から幅と高さを読む", () => {
    expect(readPngSize(header(834, 496))).toEqual({ width: 834, height: 496 });
  });

  it("PNG でない・短すぎる・大きさが 0 なら null", () => {
    const jpeg = new Uint8Array(33);
    jpeg.set([0xff, 0xd8, 0xff]);
    expect(readPngSize(jpeg)).toBeNull();
    expect(readPngSize(header(10, 10).slice(0, 20))).toBeNull();
    expect(readPngSize(header(0, 10))).toBeNull();
    expect(readPngSize(header(10_001, 10))).toBeNull();
  });
});

describe("decodeBase64Png", () => {
  it("改行の入った base64 も読める", () => {
    const b64 = Buffer.from(header(5, 7)).toString("base64");
    const r = decodeBase64Png(`${b64.slice(0, 10)}\n${b64.slice(10)}`);
    expect(r).toMatchObject({ width: 5, height: 7 });
  });

  it("上限を超える画像は弾く", () => {
    const big = new Uint8Array(MAX_QUIZ_IMAGE_BYTES + 1);
    big.set(header(1, 1));
    expect(decodeBase64Png(Buffer.from(big).toString("base64"))).toContain("大きすぎます");
  });
});
