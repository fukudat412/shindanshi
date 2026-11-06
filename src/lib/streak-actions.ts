"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getOrCreateGuestUser } from "@/lib/user-utils";
import { countStreak, toJstDay } from "@/lib/streak";

// 今日の日付を取得（JST基準で正規化）
function getToday(now: Date = new Date()): Date {
  return toJstDay(now);
}

// 日次アクティビティを記録
export async function recordDailyActivity() {
  const session = await auth();
  const userId = session?.user?.id ?? await getOrCreateGuestUser();
  const today = getToday();

  await prisma.dailyActivity.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      quizCount: { increment: 1 },
    },
    create: {
      userId,
      date: today,
      quizCount: 1,
    },
  });
}

// ストリーク（連続学習日数）を計算
// 注: userIdパラメータは内部使用のみ（stats pageから呼び出し用）
// 外部APIとして公開する場合は権限チェックを追加すること
export async function getStreak(userId?: string): Promise<number> {
  const session = await auth();
  const targetUserId = userId ?? session?.user?.id ?? await getOrCreateGuestUser();
  const today = getToday();

  // 段階的にデータを取得（大半のストリークは30日以内）
  // 30日分で足りない場合は365日分を取り直す
  const INITIAL_DAYS = 30;
  const MAX_STREAK_DAYS = 365;

  const initial = await fetchActivityKeys(targetUserId, today, INITIAL_DAYS);
  const streak = countStreak(initial, today, INITIAL_DAYS);

  // 窓の端まで続いていた（今日が未学習なら INITIAL_DAYS - 1 日）場合のみ取り直す
  if (streak < INITIAL_DAYS - 1) {
    return streak;
  }

  const extended = await fetchActivityKeys(targetUserId, today, MAX_STREAK_DAYS);
  return countStreak(extended, today, MAX_STREAK_DAYS);
}

// アクティビティのある日（"YYYY-MM-DD"）の集合を取得するヘルパー関数
async function fetchActivityKeys(
  userId: string,
  today: Date,
  days: number
): Promise<Set<string>> {
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - days);

  const activities = await prisma.dailyActivity.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    select: {
      date: true,
    },
  });
  return new Set(activities.map((a) => a.date.toISOString().slice(0, 10)));
}

// 今日の学習数を取得
export async function getTodayQuizCount(userId?: string): Promise<number> {
  const session = await auth();
  const targetUserId = userId ?? session?.user?.id ?? await getOrCreateGuestUser();
  const today = getToday();

  const activity = await prisma.dailyActivity.findUnique({
    where: {
      userId_date: {
        userId: targetUserId,
        date: today,
      },
    },
    select: {
      quizCount: true,
    },
  });

  return activity?.quizCount ?? 0;
}

// ストリーク関連データをまとめて取得
export async function getStreakData(userId?: string) {
  const session = await auth();
  const targetUserId = userId ?? session?.user?.id ?? await getOrCreateGuestUser();

  const [streak, todayCount] = await Promise.all([
    getStreak(targetUserId),
    getTodayQuizCount(targetUserId),
  ]);

  return {
    streak,
    todayCount,
  };
}
