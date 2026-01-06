"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createTopic(
  name: string,
  subjectId: string,
  description: string,
  order: number
) {
  try {
    await prisma.topic.create({
      data: { name, subjectId, description: description || null, order },
    });
    revalidatePath("/admin/topics");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create topic:", error);
    return { success: false, error: "論点の作成に失敗しました" };
  }
}

export async function deleteTopic(id: string) {
  try {
    await prisma.topic.delete({
      where: { id },
    });
    revalidatePath("/admin/topics");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete topic:", error);
    return { success: false, error: "論点の削除に失敗しました" };
  }
}
