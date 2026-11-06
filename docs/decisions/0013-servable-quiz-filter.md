# 0013 出題に servableQuizWhere を適用する

- 出題系の取得（quiz・practice・mock-exam 作成・today・ホームの復習）に `servableQuizWhere` を AND で加えた。/exams と作成済み模擬試験の採点は変更しない。
- ホームの復習リスト・件数は進捗が Quiz への relation を持たないため、`src/lib/due-review.ts` に切り出し、進捗取得後に出題可能な Quiz だけ残して件数を数える（テストで db を差し替えて検証するため）。
