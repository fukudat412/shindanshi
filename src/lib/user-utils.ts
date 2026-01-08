import { prisma } from "@/lib/prisma";

// ゲストユーザーのメールアドレス
const GUEST_EMAIL = "guest@shindanshi.local";

// ゲストユーザーを取得または作成
export async function getOrCreateGuestUser(): Promise<string> {
  let user = await prisma.user.findUnique({ where: { email: GUEST_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: GUEST_EMAIL,
        name: "ゲストユーザー",
      },
    });
  }
  return user.id;
}
