# 0003 現在のユーザーを getCurrentUserId に統一する

- `src/lib/user-utils.ts` に `getCurrentUserId()` を追加し、書き込み側（回答・ストリーク）と読み込み側（ホーム・統計・弱点・科目・記事完了）を同じユーザーに揃えた。`/exams` 配下の "default-user" は範囲外のため変更していない。
- mock-exam の page 群に残るゲスト取得の重複定義は、タスク範囲外のため触っていない。
