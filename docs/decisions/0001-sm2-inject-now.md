# 0001 SM-2 の時刻を注入可能にする

- `calculateSM2` に第2引数 `now: Date = new Date()` を追加。テストで次回復習日を固定するため。計算式は変更なし。
- 追加した `docs/decisions/` は T-001 の指示（変更理由の記録）による。
