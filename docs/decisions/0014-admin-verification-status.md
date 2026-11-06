# 0014 管理画面で検証状態を変更する
- 一覧の状態切り替えは Client Component（verification-status-buttons.tsx）に分け、既存 Button を並べた。「出題画面のパス」は servableQuizWhere を使う /quiz・/practice・/today を revalidate する。
