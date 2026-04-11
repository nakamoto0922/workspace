# frontend

TanStack Start + React + Vite をベースにした開発用プロジェクトです。  
ローカル実行と Dev Container のどちらでも同じ手順に寄せやすいよう、Node.js 22 系と npm を前提にしています。

## 前提

- Node.js `22.x`
- npm
- Docker / Dev Container を使う場合は Docker Desktop などの実行環境

Node.js のバージョン合わせには [.nvmrc](/workspace/.nvmrc) を使えます。

```bash
nvm use
```

## セットアップ

### ローカルで起動する場合

```bash
cp frontend/.env.example frontend/.env
npm ci
npm run dev
```

アプリは `http://localhost:3000` で確認できます。
backend は `http://localhost:8787` で待ち受けます。

`npm run dev` はルートから frontend と backend を一緒に起動します。frontend だけ起動したいときは `npm run dev:frontend` を使います。

既定では frontend は `127.0.0.1:3000` にバインドするので、ブラウザ URL が `http://[::1]:3000` になるのを避けやすくしています。外部公開が必要なときだけ `FRONTEND_HOST=0.0.0.0` に切り替えられます。

### Dev Container で起動する場合

1. VS Code でこのワークスペースを開く
2. `Reopen in Container` を実行する
3. コンテナ作成後、必要なら `npm run dev` を実行する

Dev Container では [`.devcontainer/devcontainer.json`](/workspace/.devcontainer/devcontainer.json) の `postCreateCommand` により、ルートで `npm ci` が自動実行されます。

## 環境変数

ひな形として [.env.example](/workspace/frontend/.env.example) を用意しています。

```bash
cp frontend/.env.example frontend/.env
```

現在の frontend は backend API を利用するので、`VITE_API_BASE_URL` を使って接続先を切り替えられます。ローカル開発では通常 `http://localhost:8787` のままで大丈夫です。`FRONTEND_HOST` は dev server のバインド先で、既定値は `127.0.0.1` です。

## よく使うコマンド

```bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build
npm run preview
npm run lint
npm run format
npm run check
npm run fix
npm run test
```

各コマンドの役割は次のとおりです。

- `npm run dev`: ルートから frontend と backend を並列起動
- `npm run dev:frontend`: ルートから frontend の開発サーバーを起動
- `npm run dev:backend`: ルートから backend の開発サーバーを起動
- `npm run build`: ルートから frontend の本番ビルドを作成
- `npm run preview`: ルートから frontend のビルド結果を確認
- `npm run lint`: ルートから frontend の静的解析を実行
- `npm run format`: ルートから frontend のフォーマット差分を確認
- `npm run check`: ルートから frontend の format と lint を実行
- `npm run fix`: ルートから frontend の自動修正を実行
- `npm run test`: ルートから frontend の Vitest を実行

まだテストファイルが無い状態でも、`npm run test` は成功扱いになります。

## 開発環境の設定

### 保存時フォーマット

VS Code では [.vscode/settings.json](/workspace/.vscode/settings.json) により、保存時に次が実行されます。

- Prettier によるフォーマット
- ESLint の自動修正

必要な拡張機能は次の 2 つです。

- `esbenp.prettier-vscode`
- `dbaeumer.vscode-eslint`

これらは Dev Container の推奨拡張にも入っています。

### コンテナ構成

- アプリコンテナ: Node.js 22 ベース
- DB コンテナ: PostgreSQL 16

[docker-compose.yml](/workspace/docker-compose.yml) では `node_modules` を named volume に分離しているため、ホスト側との依存競合を避けやすくしています。

## CI

GitHub Actions の CI を追加しています。設定ファイルは [ci.yml](/workspace/.github/workflows/ci.yml) です。

以下を自動実行します。

- `npm ci`
- `npm run check`
- `npm run build`
- `npm run test`

## 補足

- Node.js の利用バージョンは [package.json](/workspace/frontend/package.json#L5) の `engines` と [.nvmrc](/workspace/.nvmrc) で明示しています。
- エディタ共通の改行やインデントは [.editorconfig](/workspace/.editorconfig) でそろえています。
- 依存更新は npm を前提にしています。
