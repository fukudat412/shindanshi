// SM-2 間隔反復アルゴリズム（簡易版）
// 参考: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method

export interface SM2Input {
  isCorrect: boolean;
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
}

/**
 * SM-2アルゴリズムで次回復習日を計算
 *
 * @param input - 現在の学習状態
 * @returns 更新された学習状態と次回復習日
 */
export function calculateSM2(input: SM2Input): SM2Result {
  let { easeFactor, interval, repetitions } = input;
  const { isCorrect } = input;

  if (isCorrect) {
    // 正解時: 連続正解数を増やし、復習間隔を延長
    repetitions += 1;

    if (repetitions === 1) {
      // 初回正解: 1日後に復習
      interval = 1;
    } else if (repetitions === 2) {
      // 2回目正解: 6日後に復習
      interval = 6;
    } else {
      // 3回目以降: 前回間隔 × 難易度係数
      interval = Math.round(interval * easeFactor);
    }

    // 難易度係数を少し上げる（最大で緩やかに上昇）
    easeFactor = Math.min(2.5, easeFactor + 0.1);
  } else {
    // 不正解時: リセットして最初からやり直し
    repetitions = 0;
    interval = 1;
    // 難易度係数を下げる（問題が難しいことを示す）
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  // 次回復習日を計算
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);
  nextReviewAt.setHours(0, 0, 0, 0); // 日付の始まりに設定

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewAt,
  };
}

/**
 * 復習が必要かどうかを判定
 */
export function isDueForReview(nextReviewAt: Date | null): boolean {
  if (!nextReviewAt) return true; // 一度も復習していない場合は復習対象
  return new Date() >= nextReviewAt;
}

/**
 * 復習の緊急度を計算（日数で表現、負の値は期限切れ）
 */
export function getDaysUntilReview(nextReviewAt: Date | null): number {
  if (!nextReviewAt) return -999; // 未学習は最優先
  const now = new Date();
  const diffTime = nextReviewAt.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
