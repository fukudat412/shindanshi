import type { Prisma } from "@/generated/prisma/client";

export type QuizImageData = {
  data: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
};

// 画面に渡す図の情報（画像そのものは /api/quiz-images/[id] から読む）
export type QuizImageRef = { id: string; width: number; height: number };

// quiz の include に入れて、図を表示順に取る
export const quizImagesInclude = {
  select: { id: true, width: true, height: true },
  orderBy: { order: "asc" },
} satisfies Prisma.Quiz$imagesArgs;

export const MAX_QUIZ_IMAGE_BYTES = 2_000_000;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** PNG の幅と高さを IHDR から読む。PNG でなければ null */
export function readPngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  if (PNG_SIGNATURE.some((b, i) => bytes[i] !== b)) return null;
  const ihdr = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (ihdr !== "IHDR") return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width === 0 || height === 0) return null;
  return { width, height };
}

/** base64 の PNG を読み、バイト列と大きさを返す。読めなければエラーメッセージ */
export function decodeBase64Png(text: string): QuizImageData | string {
  const compact = text.replace(/\s+/g, "");
  if (compact === "" || !/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) {
    return "base64 の文字列ではありません";
  }
  const data = new Uint8Array(Buffer.from(compact, "base64"));
  if (data.length > MAX_QUIZ_IMAGE_BYTES) {
    return `画像が大きすぎます（${MAX_QUIZ_IMAGE_BYTES} バイトまで）`;
  }
  const size = readPngSize(data);
  if (!size) return "PNG 画像ではありません";
  return { data, ...size };
}
