# workspace

このリポジトリは、`frontend` と `backend` を分けた構成に整理しています。

## ディレクトリ構成

- `frontend`: TanStack Start + React のフロントエンド
- `backend`: 今後 API や DB を置くバックエンド領域
- `docs`: 設計メモやデータ構造のドキュメント

## よく使うコマンド

ルートから実行できます。

```bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build
npm run test
```

主な役割は次のとおりです。

- `npm run dev`: frontend と backend を並列で起動
- `npm run dev:frontend`: frontend だけを起動
- `npm run dev:backend`: backend だけを起動
- `npm run build`: frontend をビルド
- `npm run test`: frontend のテストを実行

backend の起動には、別途 PostgreSQL の用意と migration / seed が必要です。

## 依存のインストール

ルートの依存に加えて、workspace 依存もまとめて管理しています。

```bash
npm ci
```

## フロントエンド

フロントエンドの詳細は [frontend/README.md](/workspace/frontend/README.md) を参照してください。

## バックエンド

バックエンドの置き場は [backend/README.md](/workspace/backend/README.md) に簡単な方針をまとめています。
