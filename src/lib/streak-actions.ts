"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// デフォルトユーザーIDを取得
async function getOrCreateGuestUser() {
  const guestEmail = "guest@shindanshi.local";
  let user = await prisma.user.findUnique({ where: { email: guestEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: guestEmail,
        name: "ゲストユーザー",
      },
    });
  }
  return user.id;
}

// 今日の日付を取得（時刻を00:00:00に正規化）
function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
export async function getStreak(userId?: string): Promise<number> {
  const session = await auth();
  const targetUserId = userId ?? session?.user?.id ?? await getOrCreateGuestUser();

  // 過去365日分のアクティビティを取得
  const activities = await prisma.dailyActivity.findMany({
    where: {
      userId: targetUserId,
    },
    select: {
      date: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 365,
  });

  if (activities.length === 0) {
    return 0;
  }

  // 日付のセットを作成
  const activityDates = new Set(
    activities.map((a) => a.date.toISOString().split("T")[0])
  );

  const today = getToday();
  let streak = 0;

  // 今日から過去に向かって連続日数をカウント
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    if (activityDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      // 今日は学習していなくても、昨日以前で途切れたらストップ
      break;
    }
  }

  return streak;
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
