import { prisma } from "@/lib/prisma";

// 問題の図（PNG）を返す。取り込み直すと図の id が変わるので、長くキャッシュしてよい
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const image = await prisma.quizImage.findUnique({
    where: { id },
    select: { data: true },
  });
  if (!image) return new Response("Not Found", { status: 404 });
  return new Response(image.data, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
