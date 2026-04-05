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
npm run build
npm run test
```

これらは現在 `frontend` ワークスペースを対象に実行されます。

## 依存のインストール

現時点ではフロントエンド依存のみ管理しています。

```bash
npm ci
```

## フロントエンド

フロントエンドの詳細は [frontend/README.md](/workspace/frontend/README.md) を参照してください。

## バックエンド

バックエンドの置き場は [backend/README.md](/workspace/backend/README.md) に簡単な方針をまとめています。
