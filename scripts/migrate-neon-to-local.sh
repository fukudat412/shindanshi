#!/usr/bin/env bash
# Neon（旧本番）のデータをローカル PostgreSQL に移す。Neon 側は読むだけで変更しない。
# 使い方: npm run db:migrate-from-neon     （ローカルに既にテーブルがある場合は -- --force で作り直す）
set -euo pipefail
cd "$(dirname "$0")/.."

PG_IMAGE=postgres:18-alpine
LOCAL_USER=shindanshi
LOCAL_DB=shindanshi

[ -f .env.neon ] || { echo "✖ .env.neon がありません（Neon の接続先の退避ファイル）"; exit 1; }
read_env() { grep -E "^$1=" .env.neon | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
SRC=$(read_env DIRECT_URL); [ -n "$SRC" ] || SRC=$(read_env DATABASE_URL)
[ -n "$SRC" ] || { echo "✖ .env.neon に DIRECT_URL / DATABASE_URL がありません"; exit 1; }

echo "▶ ローカル PostgreSQL を起動"
docker compose up -d db
until docker compose exec -T db pg_isready -U "$LOCAL_USER" -d "$LOCAL_DB" >/dev/null 2>&1; do sleep 1; done
lpsql() { docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$LOCAL_USER" -d "$LOCAL_DB" "$@"; }

existing=$(lpsql -tAc "select count(*) from information_schema.tables where table_schema='public'")
if [ "$existing" != "0" ]; then
  if [ "${1:-}" = "--force" ]; then
    echo "▶ ローカルの public スキーマを作り直す（--force）"
    lpsql -qc "drop schema public cascade; create schema public;"
  else
    echo "✖ ローカル DB に既にテーブルが $existing 個あります。作り直すなら: npm run db:migrate-from-neon -- --force"
    exit 1
  fi
fi

mkdir -p backups
DUMP="backups/neon-$(date +%Y%m%d-%H%M%S).sql"
echo "▶ Neon からダンプ → $DUMP"
if ! docker run --rm "$PG_IMAGE" pg_dump "$SRC" --schema=public --no-owner --no-acl > "$DUMP"; then
  echo "✖ pg_dump に失敗。'server version mismatch' なら、このスクリプトと docker-compose.yml の postgres のメジャー版を Neon 以上に上げて再実行"
  exit 1
fi

echo "▶ ローカルに取り込み"
# ダンプ自体が CREATE SCHEMA public を含むので、既定の空の public を先に消しておく
lpsql -qc "drop schema public cascade;"
lpsql -q < "$DUMP" > /dev/null

echo "▶ 件数の突き合わせ（Neon / ローカル）"
tables=$(lpsql -tAc "select tablename from pg_tables where schemaname='public' order by 1")
mismatch=0
for t in $tables; do
  src_n=$(docker run --rm "$PG_IMAGE" psql "$SRC" -tAc "select count(*) from public.\"$t\"")
  dst_n=$(lpsql -tAc "select count(*) from public.\"$t\"")
  mark="ok"; [ "$src_n" = "$dst_n" ] || { mark="✖ 不一致"; mismatch=1; }
  printf "  %-24s %8s / %-8s %s\n" "$t" "$src_n" "$dst_n" "$mark"
done
[ "$mismatch" = 0 ] && echo "✔ 移行完了。ダンプは $DUMP に残しています" || { echo "✖ 件数が合わないテーブルがあります"; exit 1; }
