export type TodayQueueCounts = { due: number; weak: number; new: number };

export function TodayQueueSummary({ counts }: { counts: TodayQueueCounts }) {
  const total = counts.due + counts.weak + counts.new;
  if (total === 0) {
    return <p className="text-muted-foreground">今日の問題はありません</p>;
  }
  return (
    <ul className="flex flex-wrap gap-4 text-sm">
      <li>期限切れ {counts.due}件</li>
      <li>弱点論点 {counts.weak}件</li>
      <li>未出題 {counts.new}件</li>
    </ul>
  );
}
