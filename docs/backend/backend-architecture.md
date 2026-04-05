# Backend 構成メモ

このドキュメントは、`/workspace/backend` を
`Hono + Drizzle + PostgreSQL` で構成する前提で、
ディレクトリの役割を整理したものです。

---

## 方針

バックエンドは、次の3つを分けて考えます。

- `app`: サーバー起動や環境変数などのアプリ全体設定
- `db`: DB接続とテーブル定義
- `features`: 機能ごとのAPI、サービス、リポジトリ

この分け方にすると、

- ルーティング
- 業務ロジック
- 永続化

が混ざりにくくなります。

---

## ディレクトリ構成

```txt
backend/
  src/
    app/
      app.ts
      env.ts
    db/
      client.ts
      schema/
        skill-maps.ts
        users.ts
    features/
      skill-map/
        api/
          skill-map-routes.ts
        model/
          skill-map.ts
        repository/
          skill-map-repository.ts
        service/
          skill-map-service.ts
      progress/
        api/
          progress-routes.ts
        repository/
          progress-repository.ts
        service/
          progress-service.ts
    server.ts
  drizzle.config.ts
  package.json
  tsconfig.json
```

---

## 各フォルダの意味

### `src/app`
アプリ全体の入り口です。

- `app.ts`: Hono アプリを組み立てる
- `env.ts`: 環境変数の読み込みと基本設定

ここは「機能そのもの」ではなく、
アプリケーション全体に関わる設定を置く場所です。

### `src/db`
データベースまわりをまとめる場所です。

- `client.ts`: Drizzle と PostgreSQL 接続
- `schema/`: テーブル定義

機能ごとのロジックから DB 接続設定を切り離すため、
ここに集約しています。

### `src/features`
機能単位のコードを置く場所です。

今回はまず次の2機能に分けています。

- `skill-map`: スキルマップ本体
- `progress`: ユーザー進捗

将来はここに

- `auth`
- `users`
- `templates`

などを追加できます。

---

## feature 内の役割

各 feature は次のように分けています。

### `api`
Hono のルート定義です。

- HTTP リクエストを受ける
- サービスを呼ぶ
- HTTP レスポンスを返す

できるだけ薄く保ちます。

### `service`
ユースケース単位の処理です。

- 「スキルマップを取得する」
- 「ノード完了を記録する」

のようなアプリの振る舞いを表します。

複数の repository をまたぐ処理や、
簡単な検証ロジックはここに入ります。

### `repository`
DBアクセスを担当します。

- select
- insert
- update

など、永続化の責務を持ちます。

Drizzle を直接触るのは基本ここです。

### `model`
feature に閉じた型やデータ構造を置く場所です。

フロントのモデルと完全一致しなくてもよく、
「APIやDBの都合を踏まえたバックエンド側の型」を持てます。

---

## 技術選定の理由

### Hono
Hono を選ぶ理由は次の通りです。

- 軽量で始めやすい
- TypeScript と相性がよい
- ルート定義が素直
- 将来の実行環境変更にも比較的対応しやすい

今回のように、
まずはスキルマップAPIを小さく始めたいケースと相性が良いです。

### Drizzle
Drizzle を選ぶ理由は次の通りです。

- SQLに近く、DB構造を把握しやすい
- TypeScript の型が取り回しやすい
- 多対多や中間テーブルを素直に表現しやすい

今回のスキルマップは

- ノード
- エッジ
- 解放条件
- 進捗

を分けて持つため、
構造が見えやすい Drizzle と相性が良いです。

---

## DB設計の置き方

いまは次のテーブル群を想定しています。

- `skill_maps`
- `skill_nodes`
- `skill_edges`
- `skill_node_unlock_nodes`
- `users`
- `user_skill_node_progress`

ポイントは、
解放条件の `nodeIds` 配列をそのままJSONで保存せず、
`skill_node_unlock_nodes` という中間テーブルで持つ方針にしていることです。

これにより、

- 参照整合性を持たせやすい
- SQLで追いやすい
- 将来的な条件追加に備えやすい

という利点があります。

---

## 最初のAPI

いまの雛形では、まず次のエンドポイントを置いています。

- `GET /health`
- `GET /skill-maps/:skillMapId`
- `POST /progress/:skillNodeId/complete`

まだ repository は仮実装ですが、
構成としてはこのまま本実装に育てていけます。

---

## 補足

今の段階では、

- 起動の土台
- DBスキーマの置き場
- feature ごとの責務分離

を先に固めることを目的にしています。

このあと進める順番としては、

1. Drizzle の migration を作る
2. repository を本実装にする
3. フロントから叩く API を増やす

が自然です。
