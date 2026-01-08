"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createSubject(name: string, order: number) {
  try {
    await prisma.subject.create({
      data: { name, order },
    });
    revalidatePath("/admin/subjects");
    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create subject:", error);
    return { success: false, error: "科目の作成に失敗しました" };
  }
}

export async function deleteSubject(id: string) {
  try {
    await prisma.subject.delete({
      where: { id },
    });
    revalidatePath("/admin/subjects");
    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete subject:", error);
    return { success: false, error: "科目の削除に失敗しました" };
  }
}
