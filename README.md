# workspace

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
cp .env.example .env
npm ci
npm run dev
```

アプリは `http://localhost:3000` で確認できます。

### Dev Container で起動する場合

1. VS Code でこのワークスペースを開く
2. `Reopen in Container` を実行する
3. コンテナ作成後、必要なら `npm run dev` を実行する

Dev Container では [`.devcontainer/devcontainer.json`](/workspace/.devcontainer/devcontainer.json) の `postCreateCommand` により `npm ci` が自動実行されます。

## 環境変数

ひな形として [.env.example](/workspace/.env.example) を用意しています。

```bash
cp .env.example .env
```

現時点ではアプリ本体で必須の環境変数はありませんが、将来の DB 接続やサーバー設定に使えるよう、開発用の基本値を入れています。

## よく使うコマンド

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
npm run check
npm run fix
npm run test
```

各コマンドの役割は次のとおりです。

- `npm run dev`: 開発サーバーを起動
- `npm run build`: 本番ビルドを作成
- `npm run preview`: ビルド結果をローカル確認
- `npm run lint`: ESLint による静的解析
- `npm run format`: Prettier でフォーマット差分を確認
- `npm run check`: フォーマット確認と lint をまとめて実行
- `npm run fix`: Prettier と ESLint の自動修正を実行
- `npm run test`: Vitest を実行

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

- Node.js の利用バージョンは [package.json](/workspace/package.json#L5) の `engines` と [.nvmrc](/workspace/.nvmrc) で明示しています。
- エディタ共通の改行やインデントは [.editorconfig](/workspace/.editorconfig) でそろえています。
- 依存更新は npm を前提にしています。
