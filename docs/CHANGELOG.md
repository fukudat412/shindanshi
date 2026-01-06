# 変更履歴

## 2026-01-06

### 追加: 論点（Topic）管理機能
- **Topicモデル追加**: 問題を論点単位で管理するためのデータモデルを追加
  - `topics`テーブル（id, name, description, subjectId, order）
  - Subject（科目）に紐づく1対多のリレーション
- **Quiz/Articleへのtopic紐付け**: 既存のQuiz/ArticleにtopicIdを追加（nullable、既存データへの影響なし）
- **管理画面UI**:
  - `/admin/topics` - 論点の一覧表示・作成・削除
  - 科目ごとにグループ化された一覧表示
  - 記事作成フォームに論点選択を追加
  - クイズ作成フォームに論点選択を追加
- **TODO.md更新**: カイゼン計画（3ステップ）を追記

### 変更
- 管理画面トップに「論点」カードを追加（件数表示）

### 技術的な変更
- prisma/schema.prisma: Topicモデル追加、Article/QuizにtopicIdフィールド追加
- src/app/admin/topics/: 新規ディレクトリ追加（actions.ts, page.tsx, topic-form.tsx, delete-button.tsx）
