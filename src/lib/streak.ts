const DAY_MS = 24 * 60 * 60 * 1000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000; // JST = UTC+9

// JST の暦日を、その日付の UTC 0 時の Date で返す
// サーバーのタイムゾーンに依存しないよう、UTC 基準で計算する
export function toJstDay(now: Date): Date {
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  return new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate())
  );
}

// 連続学習日数を数える（キーは "YYYY-MM-DD"）
// 仕様: 今日まだ学習していなくても、昨日から続いていれば継続とみなす
export function countStreak(
  activityDayKeys: ReadonlySet<string>,
  today: Date,
  maxDays: number
): number {
  let streak = 0;
  for (let i = 0; i < maxDays; i++) {
    const key = new Date(today.getTime() - i * DAY_MS).toISOString().slice(0, 10);
    if (activityDayKeys.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}
