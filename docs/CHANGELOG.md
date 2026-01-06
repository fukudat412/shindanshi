# 変更履歴

## 2026-01-07

### 追加: 品質チェック・ドキュメント
- **CI追加**（`.github/workflows/ci.yml`）
  - ESLint実行
  - TypeScript型チェック
  - ビルド確認
- **コンテンツポリシー作成**（`docs/CONTENT_POLICY.md`）
  - 著作権・引用ルール
  - 問題作成時のチェックリスト

### 改善: 管理画面UX
- **クイズ一覧の表示改善**
  - 論点（Topic）バッジを表示
  - フェーズ（導入/理解/定着/試験）を表示
  - MULTIPLE_CHOICEタイプの表示を追加
- **一括生成へのリンク追加**
  - クイズ管理画面から問題生成ページへ遷移可能

---

### 追加: 問題生成パイプライン（ステップ3）
- **QuizPhase（学習フェーズ）を追加**
  - `INTRO`: 導入（定義確認、○×/短文）
  - `UNDERSTAND`: 理解（判断基準、手順）
  - `RETAIN`: 定着（ひっかけ、逆方向）
  - `EXAM`: 試験対策（ミニケース、実践）
- **クイズ作成フォームにフェーズ選択を追加**
  - 新規クイズ作成時にフェーズを指定可能
  - 既存クイズはデフォルトで`UNDERSTAND`に設定
- **問題生成機能を追加**（`/admin/generate`）
  - 論点を選択すると5つのテンプレート問題を自動生成
  - フェーズ・タイプの編集が可能
  - 一括登録機能
- **問題テンプレートドキュメントを作成**（`docs/QUESTION_TEMPLATES.md`）
  - 1論点から5〜7問を生成するテンプレート定義
  - 各フェーズの問題例と解説の書き方
  - JSON出力形式の仕様

### 技術的な変更
- prisma/schema.prisma: QuizPhase enum追加、Quizにphaseフィールド追加
- src/app/admin/generate/: 新規ディレクトリ追加（actions.ts, page.tsx, generate-form.tsx）
- src/app/admin/quizzes/: QuizFormにphase選択UI追加

---

## 2026-01-06

### 追加: 復習キュー機能（ステップ2）
- **トップページの「今日の復習5問」を改善**
  - 復習が必要なクイズの問題文を表示
  - 関連する論点（Topic）と科目名を表示
  - SM-2アルゴリズムに基づく優先順位付け
- **弱点論点ランキングを追加**
  - topic単位の正答率を計算
  - 正答率が低い論点TOP5を表示
  - 論点ごとの正解数/問題数を表示
- **SRSロジック確認済み**
  - 間違えた問題は翌日に復習
  - 連続正解で復習間隔を1日→6日→EF倍と延長

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
