"use server";

import { prisma } from "@/lib/prisma";

type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

export async function signUp(input: SignUpInput) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      return { success: false, error: "このメールアドレスは既に登録されています" };
    }

    // Create new user
    // Note: In production, use bcrypt to hash password
    // const hashedPassword = await bcrypt.hash(input.password, 10);
    await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: input.password, // In production, use hashedPassword
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: "アカウントの作成に失敗しました" };
  }
}
