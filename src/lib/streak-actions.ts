"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getOrCreateGuestUser } from "@/lib/user-utils";

// 今日の日付を取得（JST基準で正規化）
// サーバーのタイムゾーンに依存しないよう、UTC基準でJST日付を計算
function getToday(): Date {
  const now = new Date();
  const jstOffset = 9 * 60; // JST = UTC+9
  const jstNow = new Date(now.getTime() + jstOffset * 60 * 1000);
  return new Date(Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate()));
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
  // 30日分で足りない場合は全件取得にフォールバック
  const INITIAL_DAYS = 30;
  const MAX_STREAK_DAYS = 365;

  let activities = await fetchActivities(targetUserId, today, INITIAL_DAYS);

  if (activities.length === 0) {
    return 0;
  }

  // 日付のセットを作成
  let activityDates = new Set(
    activities.map((a) => a.date.toISOString().split("T")[0])
  );

  let streak = 0;
  let needMoreData = false;

  // 今日から過去に向かって連続日数をカウント
  // 仕様: 今日はまだ学習していなくてもストリークは継続
  // （例: 昨日まで連続5日学習していれば、今日ページを開いた時点でstreak=5）
  for (let i = 0; i < INITIAL_DAYS; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    if (activityDates.has(dateStr)) {
      streak++;
      // 30日連続かつ最終日もアクティビティあり→追加データが必要かも
      if (i === INITIAL_DAYS - 1) {
        needMoreData = true;
      }
    } else if (i > 0) {
      // 今日(i=0)は学習していなくても継続、昨日以前(i>0)で途切れたら終了
      break;
    }
  }

  // 30日連続達成した場合、追加でデータを取得して続きをカウント
  if (needMoreData) {
    activities = await fetchActivities(targetUserId, today, MAX_STREAK_DAYS);
    activityDates = new Set(
      activities.map((a) => a.date.toISOString().split("T")[0])
    );

    for (let i = INITIAL_DAYS; i < MAX_STREAK_DAYS; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      if (activityDates.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
  }

  return streak;
}

// アクティビティ取得のヘルパー関数
async function fetchActivities(userId: string, today: Date, days: number) {
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);

  return prisma.dailyActivity.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    select: {
      date: true,
    },
    orderBy: {
      date: "desc",
    },
  });
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
