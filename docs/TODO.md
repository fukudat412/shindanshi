# TODO

## MVP完了項目
- [x] Next.js App Router プロジェクト作成
- [x] Prisma + Neon セットアップ
- [x] shadcn/ui インストール
- [x] トップページ（進捗表示）
- [x] 科目一覧ページ
- [x] 科目詳細ページ（記事一覧）
- [x] 記事ページ（Markdown表示）
- [x] クイズページ（○×/短文/数値）
- [x] 管理画面（科目/記事/クイズ CRUD）
- [x] シードデータ

## セットアップ手順
1. `.env`にNeonのDATABASE_URLを設定
2. `npm install`
3. `npx prisma db push` でスキーマ反映
4. `npm run db:seed` でサンプルデータ投入
5. `npm run dev` で開発サーバー起動（ポート40000）

## 今後の拡張候補
- [ ] 学習履歴の可視化強化（グラフ表示）
- [ ] 論点マップ表示
- [ ] 二次試験の自己採点テンプレ
- [ ] タグ検索機能
- [ ] スキマ時間モード（ランダム出題）
- [ ] ダークモード対応
- [ ] PWA対応（オフライン学習）

## 技術的改善
- [ ] テストコード追加
- [ ] エラーハンドリング強化
- [ ] ローディング状態の改善
- [ ] SEO対策（メタデータ）

---

## カイゼン計画（3ステップ）
> 参照: docs/claude_kaizen_guide.md

### ステップ1: topics導入（論点管理）
- [x] Topicモデルを追加（id, name, description, subjectId）
- [x] Quiz/ArticleにtopicIdリレーションを追加
- [x] 管理画面にTopic CRUD追加
- [x] Quiz/Article編集画面にtopic選択を追加

### ステップ2: 復習キュー（少ない問題でも足りる体験）
- [x] トップページに「今日の復習5問」を表示
- [x] topic単位の正答率ランキングを表示
- [x] 間違えた問題の次回出題日を自動設定（SM-2アルゴリズム実装済み）

### ステップ3: 問題生成パイプライン
- [x] Quizにphase（intro/understand/retain/exam）を追加
- [x] 1論点から5問を生成するテンプレ定義（docs/QUESTION_TEMPLATES.md）
- [x] 管理画面で問題生成を実行可能に（/admin/generate）

### ステップ4: 品質チェック・UX改善
- [x] lint/typecheck の CI を追加（.github/workflows/ci.yml）
- [x] docs/CONTENT_POLICY.md を作成
- [x] 管理画面の入稿UX改善（クイズ一覧の表示改善）
