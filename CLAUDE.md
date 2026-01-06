# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

中小企業診断士試験対策の学習サイト。Next.js 16 (App Router) + TypeScript + Prisma + PostgreSQL構成。

## よく使うコマンド

```bash
npm run dev          # 開発サーバー (localhost:40000)
npm run build        # ビルド
npm run lint         # ESLint
npm run db:push      # スキーマ反映
npm run db:seed      # シードデータ
npm run db:studio    # Prisma Studio
```

## アーキテクチャ

### ディレクトリ構成
- `src/app/` - Next.js App Router（ページ・API）
- `src/components/ui/` - shadcn/uiコンポーネント
- `src/lib/` - ユーティリティ・Prismaクライアント
- `prisma/` - スキーマ・シードデータ

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

- `main` - 本番環境用（直接コミット禁止）
- `develop` - 開発用メインブランチ
- 機能開発は`develop`から分岐し、PRで`develop`にマージ
- `develop`が安定したら`main`にマージ

## 注意事項

- 未使用コードは作成しない（将来用の実装は不要）
- 新しいUIコンポーネントはshadcn/uiから追加
- データベース変更後は`npm run db:push`
- 作業は`develop`ブランチで行う
