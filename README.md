# 中小企業診断士 学習サイト

中小企業診断士試験対策のための無料学習プラットフォームです。SM-2アルゴリズムによる間隔反復学習で効率的に知識を定着させます。

## 機能

- **科目別学習**: 7科目の体系的な学習コンテンツ
- **クイズ機能**: ○×問題、短文回答、数値回答の3タイプ
- **間隔反復学習**: SM-2アルゴリズムによる復習スケジュール最適化
- **ランダム演習**: 複数科目からの出題カスタマイズ
- **弱点分析**: 低スコア科目の特定と重点復習
- **学習統計**: 進捗の可視化
- **管理機能**: 科目・記事・クイズのCRUD操作

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **データベース**: PostgreSQL (Neon)
- **ORM**: Prisma
- **スタイリング**: Tailwind CSS 4
- **UIコンポーネント**: shadcn/ui + Radix UI
- **数式表示**: KaTeX

## セットアップ

### 必要条件

- Node.js 18以上
- PostgreSQLデータベース

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してDATABASE_URLを設定

# データベースのセットアップ
npm run db:push

# シードデータの投入（オプション）
npm run db:seed
```

### 開発サーバーの起動

```bash
npm run dev
```

http://localhost:40000 でアクセスできます。

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 (port 40000) |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run lint` | ESLint実行 |
| `npm run db:push` | スキーマをDBに反映 |
| `npm run db:seed` | シードデータ投入 |
| `npm run db:studio` | Prisma Studio起動 |

## プロジェクト構成

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # ホームページ
│   ├── subjects/          # 科目閲覧
│   ├── articles/          # 記事詳細
│   ├── quiz/              # クイズ実施
│   ├── practice/          # ランダム演習
│   ├── weakness/          # 弱点分析
│   ├── stats/             # 学習統計
│   └── admin/             # 管理画面
├── components/
│   ├── ui/                # shadcn/ui コンポーネント
│   └── nav-link.tsx       # ナビゲーション
└── lib/
    ├── prisma.ts          # Prismaクライアント
    ├── spaced-repetition.ts # SM-2アルゴリズム
    └── utils.ts           # ユーティリティ
```

## ライセンス

MIT
