# backend

Hono + Drizzle + PostgreSQL を前提にしたバックエンドです。

現時点では、次の土台まで入っています。

- Hono のアプリ起動
- Drizzle の設定
- PostgreSQL スキーマ定義
- migration 実行スクリプト
- seed データ投入スクリプト
- `skill-map` と `progress` の feature 分割
- 最小 API エンドポイント

詳しい構成は [backend-architecture.md](/workspace/docs/backend/backend-architecture.md) を参照してください。

## 環境変数

開発用のひな形は [backend/.env.example](/workspace/backend/.env.example) にあります。

Dev Container 内で動かす前提では、PostgreSQL ホストは `db` です。

## DB コマンド

DBスキーマを変更したあとの基本フローは次の通りです。

```bash
cd /workspace
npm run db:generate --workspace backend
npm run db:migrate --workspace backend
npm run db:seed --workspace backend
```

- `db:generate`: schema 変更から migration SQL を生成する
- `db:migrate`: 生成済み migration を DB に適用する
- `db:seed`: 開発確認用のサンプルデータを投入する

`db:push` も残していますが、日常運用は `generate` + `migrate` を基本にする想定です。
