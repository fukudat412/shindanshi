"use client";

// CSSベースのシンプルな棒グラフ（外部ライブラリ不要）
export function ActivityChart({ data }: { data: [string, number][] }) {
  const maxValue = Math.max(...data.map(([, v]) => v), 1);

  // 過去30日分のデータを準備
  const last30Days: [string, number][] = [];
  const today = new Date();
  const dataMap = new Map(data);

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    last30Days.push([dateStr, dataMap.get(dateStr) ?? 0]);
  }

  // 週の区切りを計算
  const weekLabels: { index: number; label: string }[] = [];
  last30Days.forEach(([date], index) => {
    const d = new Date(date);
    if (d.getDay() === 0 || index === 0) {
      // 日曜日または最初の日
      weekLabels.push({
        index,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }
  });

  return (
    <div className="space-y-2">
      {/* 棒グラフ */}
      <div className="flex items-end gap-1 h-32">
        {last30Days.map(([date, count]) => {
          const height = count > 0 ? Math.max((count / maxValue) * 100, 8) : 4;
          return (
            <div
              key={date}
              className="flex-1 relative group"
              title={`${date}: ${count}問`}
            >
              <div
                className={`w-full rounded-t transition-colors ${
                  count > 0
                    ? "bg-primary hover:bg-primary/80"
                    : "bg-muted hover:bg-muted/80"
                }`}
                style={{ height: `${height}%` }}
              />
              {/* ツールチップ */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {date.slice(5)}: {count}問
              </div>
            </div>
          );
        })}
      </div>

      {/* 日付ラベル */}
      <div className="flex text-xs text-muted-foreground">
        {weekLabels.map(({ index, label }) => (
          <div
            key={index}
            className="absolute"
            style={{ left: `${(index / 30) * 100}%` }}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="relative h-4">
        <div className="absolute left-0 text-xs text-muted-foreground">
          30日前
        </div>
        <div className="absolute right-0 text-xs text-muted-foreground">
          今日
        </div>
      </div>
    </div>
  );
}
