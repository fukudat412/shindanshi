"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

export async function signUp(input: SignUpInput) {
  try {
    // バリデーション
    if (!input.email || !input.email.includes("@")) {
      return { success: false, error: "有効なメールアドレスを入力してください" };
    }

    if (!input.password || input.password.length < 8) {
      return { success: false, error: "パスワードは8文字以上にしてください" };
    }

    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "お名前を入力してください" };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      return { success: false, error: "このメールアドレスは既に登録されています" };
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: "アカウントの作成に失敗しました" };
  }
}
