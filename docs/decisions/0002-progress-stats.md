# 0002 科目別集計を純粋関数に切り出す

- `src/lib/progress-stats.ts` を追加し、stats/weakness 両ページの重複集計を置き換えた。stats の科目別・正解数は attemptCount > 0 のみが対象になる（弱点ページの仕様に揃える）。
- `summarizeOverall` も answeredCount を attemptCount > 0 の進捗に限定した（仕様に明記がないため「回答済み」の語義に従った）。
