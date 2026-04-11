# Drizzle コマンドメモ

このドキュメントは、`/workspace/backend` で
Drizzle を使うときの基本コマンドをまとめたものです。

前提:

- ルートは `/workspace`
- `backend` は npm workspace
- DB は PostgreSQL

---

## まず覚えること

普段よく使うのはこの4つです。

```bash
npm run db:baseline --workspace backend -- 0000_watery_morgan_stark
npm run db:generate --workspace backend
npm run db:migrate --workspace backend
npm run db:seed --workspace backend
npm run test:backend
```

意味:

- `db:baseline`: 既存DBに migration 履歴だけを登録する
- `db:generate`: スキーマから migration ファイルを生成する
- `db:migrate`: 生成済み migration をDBへ適用する
- `db:seed`: 開発用のサンプルデータを投入する
- `test:backend`: 型チェックで backend の壊れを確認する

---

## 1. 依存インストール

最初のセットアップ時はルートで実行します。

```bash
cd /workspace
npm ci
```

---

## 2. スキーマを書き換える

テーブル定義はここにあります。

- [skill-maps.ts](/workspace/backend/src/db/schema/skill-maps.ts)
- [users.ts](/workspace/backend/src/db/schema/users.ts)

まずはこれらを編集して、欲しいDB構造をコードで定義します。

---

## 3. baseline を入れる

以前 `db:push` などで作った既存DBを
`db:migrate` 運用へ移したいときは最初にこれを実行します。

```bash
cd /workspace
npm run db:baseline --workspace backend -- 0000_watery_morgan_stark
```

これは schema 自体を変更せず、
`drizzle.__drizzle_migrations` に既存 migration の履歴を登録します。

どこまで適用済みのDBかに応じて、
最後の引数に baseline 対象の tag を渡します。

例:

- `0000_watery_morgan_stark` まで入っているDB
- `0001_wandering_the_santerians` まで入っているDB

のように、実際の状態に合わせて指定します。

初回だけ必要になる想定です。

---

## 4. migration を生成する

スキーマ変更後に migration を生成します。

```bash
cd /workspace
npm run db:generate --workspace backend
```

これは `backend/drizzle.config.ts` を見て、

- どの schema を対象にするか
- どこへ migration を出力するか

を決めて実行します。

生成先は今の設定だと `backend/drizzle/` です。

---

## 5. migration を適用する

ローカルDBに生成済み migration を適用します。

```bash
cd /workspace
npm run db:migrate --workspace backend
```

こちらを通常フローの基本にします。

### `db:migrate` のイメージ

- `backend/drizzle/` の migration ファイルを順番に読む
- 未適用分だけをDBへ流す
- ローカル・CI・本番で同じ履歴を使いやすい

変更履歴をファイルとして残せるので、
チーム開発ではこちらのほうが扱いやすいです。

---

## 6. seed を流す

開発確認用のデータを入れたいときは次を実行します。

```bash
cd /workspace
npm run db:seed --workspace backend
```

現状の seed では、最小限の次のデータが入ります。

- サンプルの `skill_map`
- 2つの `skill_node`
- ノード間の `edge`
- unlock 条件
- サンプルユーザー
- 1件の進捗データ

---

## 7. `db:push` を使う場面

```bash
cd /workspace
npm run db:push --workspace backend
```

`db:push` は残していますが、
これは「一時的に手元で素早く試したい」とき向けです。

履歴管理を前提にするなら、
基本は `db:generate` + `db:migrate` を使います。

---

## 8. 型チェックする

スキーマや repository を変えたあとに確認します。

```bash
cd /workspace
npm run test:backend
```

現状では `test:backend` は実質 `tsc --noEmit` です。

つまり、

- import が壊れていないか
- 型が合っているか
- Drizzle 周辺で型エラーが出ていないか

を確認できます。

---

## 9. ビルド確認する

型チェックだけでなく、ビルドできるかも見たいときはこれです。

```bash
cd /workspace
npm run build:backend
```

---

## 10. バックエンドを起動する

Hono のサーバーを起動します。

```bash
cd /workspace
npm run dev:backend
```

現状では `tsx watch` で起動します。

---

## 11. よくある作業の流れ

### テーブルを追加したいとき

1. 既存DBなら最初に `npm run db:baseline --workspace backend -- <適用済みtag>`
2. `backend/src/db/schema/*.ts` を編集
3. `npm run db:generate --workspace backend`
4. `npm run db:migrate --workspace backend`
5. 必要なら `npm run db:seed --workspace backend`
6. `npm run test:backend`

### カラムを追加したいとき

1. スキーマを編集
2. `db:generate`
3. `db:migrate`
4. repository や service の型を修正

### DBまわりの変更後に最低限確認したいこと

1. `npm run test:backend`
2. `npm run build:backend`

---

## 12. 設定ファイル

Drizzle の設定は [drizzle.config.ts](/workspace/backend/drizzle.config.ts) にあります。

ここで見ている主な項目:

- `schema`: テーブル定義の場所
- `out`: migration の出力先
- `dialect`: `postgresql`
- `dbCredentials.url`: 接続先

---

## 13. 環境変数

DB接続文字列は `DATABASE_URL` を使います。

現在は `backend/src/app/env.ts` で、
未指定時に次のデフォルトを使います。

```txt
postgres://postgres:postgres@localhost:5432/appdb
```

必要なら `.env` に入れて上書きできます。

---

## 14. まず何を使えばいいか

迷ったら次の順番で十分です。

1. 既存DBなら最初に `npm run db:baseline --workspace backend -- <適用済みtag>`
2. スキーマを書く
3. `npm run db:generate --workspace backend`
4. `npm run db:migrate --workspace backend`
5. 必要なら `npm run db:seed --workspace backend`
6. `npm run test:backend`

最初はこれだけ覚えておけば進められます。
