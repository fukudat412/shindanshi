# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

中小企業診断士試験対策の学習サイト。Next.js 16 (App Router) + TypeScript 6 + Prisma 7 + PostgreSQL 18構成（Node 26）。DBはローカルのPostgreSQL（docker compose）で、デプロイ先はない（Macのローカルで使う）。

## よく使うコマンド

```bash
npm run db:up        # ローカルPostgreSQL起動（docker compose）
npm run dev          # 開発サーバー (localhost:40000)
npm run build        # ビルド
npm run lint         # ESLint
npm run db:push      # スキーマ反映（Prisma Client の再生成も行う）
npm run db:seed      # シードデータ
npm run db:studio    # Prisma Studio
```

## アーキテクチャ

### ディレクトリ構成
- `src/app/` - Next.js App Router（ページ・API）
- `src/components/ui/` - shadcn/uiコンポーネント
- `src/lib/` - ユーティリティ・Prismaクライアント
- `src/generated/prisma/` - Prisma Client の生成物（git 管理外。`npx prisma generate` で作られる）
- `prisma/` - スキーマ・シードデータ（接続先は `prisma.config.ts`）

### Prisma 7 の使い方
- `PrismaClient` は `@/lib/prisma` の `prisma` を使う。型・enum は `@/generated/prisma/client`（サーバー）、Client Component からは `@/generated/prisma/enums` を import する。`@prisma/client` からは import しない
- `prisma db push` は Prisma Client を再生成しない。スキーマを変えたら続けて `npx prisma generate` を実行する（`next dev` は起動し直す。古い client がキャッシュに残るため）

### 依存のインストールスクリプト（npm 12）
- npm 12 は、`package.json` の `allowScripts` に載っていない依存のインストールスクリプトを実行しない。許可はバージョン固定なので、prisma・esbuild などを上げたら `npm install-scripts ls` で確認し、信頼できるものだけ `npm install-scripts approve <pkg>` する

### データモデル
- **Subject** - 科目（1対多でArticle）
- **Article** - 記事（1対多でQuiz）
- **Quiz** - クイズ（TRUE_FALSE, SHORT_TEXT, NUMBER）
- **UserProgress** - 学習進捗（SM-2アルゴリズム用パラメータ含む）

### 主要パターン
- Server Components優先、必要な箇所のみClient Components
- Server Actionsでデータ変更（`"use server"`）
- `revalidatePath()`でキャッシュ更新

## コーディング規約

### 全般
- TypeScript厳格モード
- 日本語コメント可
- shadcn/uiコンポーネントを優先使用

### ファイル配置
- ページ固有のコンポーネントは同じディレクトリに配置
- 共通コンポーネントは`src/components/`
- Server Actionsは`actions.ts`

### スタイリング
- Tailwind CSS使用
- インラインスタイル禁止
- `cn()`でクラス名結合

## ブランチ戦略

- `main` - 常にlint・型チェック・テスト・ビルドが通る状態。push しても自動デプロイはされない
- 人が手で作業するときは`main`から`feature/xxx`や`fix/xxx`ブランチを作成し、PRで`main`にマージ
- 無人ループ（hootl）は専用のcloneでタスクごとにブランチを切り、ゲートとレビューを通ったものだけを`main`にマージしてpushする

## エージェント活用

以下のエージェントを積極的に使用すること：

### task-planner
- **用途**: 機能計画、タスク分解、実装戦略の策定
- **使用タイミング**:
  - 新機能の実装前
  - 複数の要件が含まれるタスク
  - 実装順序や優先度の整理が必要な時
- **例**: 「クイズ結果の統計ページを追加したい」「認証機能を実装したい」

### implementation-code-reviewer
- **用途**: 実装完了後のコードレビュー
- **使用タイミング**:
  - コンポーネント・機能の実装完了時
  - Server Actionsの実装後
  - Prismaスキーマ変更後
- **レビュー観点**: 実装粒度、パフォーマンス、アンチパターン、セキュリティ

## 注意事項

- 未使用コードは作成しない（将来用の実装は不要）
- 新しいUIコンポーネントはshadcn/uiから追加
- データベース変更後は`npm run db:push`

## 無人ループ（hootl）で動いているとき

環境変数 `HOOTL_TASK_ID` が設定されているときは、無人のループで1タスクだけを担当している。人は不在で、質問には誰も答えない。このときは、上の「ブランチ戦略」「エージェント活用」より、次のルールを優先する。

### やってよいこと（必要なら迷わずやる）

- 依存パッケージの追加・更新（`npm install`）、`package.json` の編集
- `prisma/schema.prisma` の変更と `npx prisma db push`、続けて `npx prisma generate`（接続先は使い捨てのテスト用 DB。毎回リセットされる）。`--force-reset` と `--accept-data-loss` は AI エージェントからは Prisma が実行を拒否するので使わない（データが消える変更はゲートが `--accept-data-loss` 付きで反映する）
- shadcn/ui コンポーネントの追加
- 設計判断の記録（`docs/decisions/`）

依存を足したりスキーマを変えたりしたら、理由を `docs/decisions/NNNN-<slug>.md` に1〜3行で残す（レビューが妥当性を判断する材料になる）。

### やってはいけないこと（機械的に検出されて差し戻される）

- テストの `skip` / `only` / `todo` の追加、既存テストの削除
- `@ts-ignore` / `@ts-expect-error` / `eslint-disable` の追加
- 判定する側のファイルの変更: `tsconfig.json`、`eslint.config.mjs`、`vitest.config.*`、`playwright.config.*`、`.github/`、`CLAUDE.md`、`.claude/`
- コミット・push・ブランチ操作（ハーネスが行う）

### 進め方

1. 受け入れ条件1つにつき、少なくとも1つのテストを書く。テストは `tests/` 以下に置き、テスト名に `<タスクID> AC<番号>` を入れる。
2. 時刻と乱数は引数で注入できるようにする（既定値は `new Date()` / `Math.random`）。テストでは固定値を渡す。
3. タスクの「書いてよいパス」を基本にする。それ以外を変える必要があれば変えてよいが、理由を `docs/decisions/` に残す（説明のない範囲外の変更は差し戻される）。
4. 判断できないことは推測で埋めない。`docs/decisions/` に「判断不能: 〜」と書いて終える。
5. 終わる前に、プロンプトに書かれたゲートを全部実行し、通ることを確認する。

仕様は `spec.md`、無人開発の標準は hootl-sdd の `docs/dev-standards.md` に従う。
