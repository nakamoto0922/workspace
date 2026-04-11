# Database Schema メモ

このドキュメントは、`/workspace/backend/src/db/schema` にある
Drizzle スキーマをもとに、
バックエンドのDB構成を整理したものです。

対象技術:

- PostgreSQL
- Drizzle ORM
- Hono

---

## 方針

DBでは大きく次の2種類の情報を分けて持ちます。

- スキルマップそのもの
- ユーザーごとの進捗

つまり、

- 「どんなマップか」は共通データ
- 「誰がどこまで終わったか」は個別データ

として保存します。

---

## 全体像

現在想定しているテーブルは次の6つです。

- `skill_maps`
- `skill_nodes`
- `skill_edges`
- `skill_node_unlock_nodes`
- `users`
- `user_skill_node_progress`

関係のイメージは次の通りです。

```txt
skill_maps
  └─ skill_nodes
       ├─ skill_edges
       └─ skill_node_unlock_nodes

users
  └─ user_skill_node_progress
       ├─ skill_maps
       └─ skill_nodes
```

---

## 1. `skill_maps`

スキルマップ全体を表す親テーブルです。

主なカラム:

- `id`
- `name`
- `version`
- `created_at`
- `updated_at`

役割:

- 1つの学習マップを識別する
- マップ名やバージョンを持つ
- ノードやエッジの親になる

例:

- `Webフロントエンド入門`
- `Reactロードマップ`

---

## 2. `skill_nodes`

マップ内の各ノードを表すテーブルです。

主なカラム:

- `id`
- `skill_map_id`
- `code`
- `title`
- `description`
- `kind`
- `layout_column`
- `layout_row`
- `unlock_mode`
- `difficulty`
- `memo`
- `created_at`
- `updated_at`

### 役割

1ノード = 1学習項目です。

ここには、

- ノード名
- ノードの粒度
- 画面上の位置
- 解放条件の評価方法

を持たせます。

### 補足

`unlock_mode` は持ちますが、
解放条件の相手ノード一覧まではここに直接持ちません。

その一覧は `skill_node_unlock_nodes` で管理します。

---

## 3. `skill_edges`

ノード間の接続線を表すテーブルです。

主なカラム:

- `id`
- `skill_map_id`
- `from_node_id`
- `to_node_id`
- `kind`

### 役割

これは主に見た目上のつながりを表します。

意味としては、

- どのノードから
- どのノードへ
- どういう線でつなぐか

です。

### 注意

`skill_edges` は「線」を表すだけで、
ノードが開く条件そのものではありません。

実際に unlock を決めるのは
`skill_nodes.unlock_mode` と `skill_node_unlock_nodes` です。

---

## 4. `skill_node_unlock_nodes`

ノードの解放条件に使う「前提ノード」を表す中間テーブルです。

主なカラム:

- `id`
- `skill_node_id`
- `required_node_id`

### 役割

たとえば、あるノードが

- Aを前提にする
- Bを前提にする
- Cを前提にする

というとき、その対応関係を1行ずつ持ちます。

### `unlock_mode` との組み合わせ

例:

- `skill_nodes.unlock_mode = 'all'`
- `skill_node_unlock_nodes` に `A`, `B`

なら、

- AとBの両方完了で解放

です。

逆に、

- `skill_nodes.unlock_mode = 'any'`
- `skill_node_unlock_nodes` に `A`, `B`, `C`

なら、

- A/B/C のどれか1つ完了で解放

です。

### この形にする理由

JSONや配列1カラムで持たずに中間テーブル化することで、

- 参照整合性を保ちやすい
- SQLで追いやすい
- 多対多関係を自然に表現できる

という利点があります。

---

## 5. `users`

ユーザー本体です。

主なカラム:

- `id`
- `name`
- `created_at`

今は最小限ですが、
将来的にはここに

- メールアドレス
- 認証情報
- 表示名

などを拡張できます。

---

## 6. `user_skill_node_progress`

ユーザーごとの進捗を表すテーブルです。

主なカラム:

- `id`
- `user_id`
- `skill_map_id`
- `skill_node_id`
- `completed_at`
- `created_at`
- `updated_at`

### 役割

「あるユーザーが、あるマップの、あるノードを完了したか」を保存します。

つまり、

- マップ定義そのもの
- ユーザーの進行状態

を分離するためのテーブルです。

### 現在の扱い

今は `completed_at` を持つ形なので、

- `NULL`: 未完了
- 日時あり: 完了済み

という解釈ができます。

必要なら将来、

- `status`
- `started_at`
- `archived_at`

などを足すこともできます。

---

## 保存の考え方

今のDB設計では、次のように責務を分けています。

### マップ定義

- `skill_maps`
- `skill_nodes`
- `skill_edges`
- `skill_node_unlock_nodes`

### ユーザー進捗

- `users`
- `user_skill_node_progress`

この分離により、

- 同じマップを複数ユーザーで共有できる
- マップ編集と進捗保存を分けられる
- 状態計算をアプリ側で素直に行える

というメリットがあります。

---

## 現時点での補足

今のスキーマは、まず土台を作るための最小構成です。

今後追加候補になりやすいのは次です。

- 一意制約
  - 例: `skill_nodes(skill_map_id, code)`
- インデックス
  - 例: `skill_edges(skill_map_id)`
- タグ用テーブル
- 参考リンク用テーブル
- ノードメモの分離

特に本実装では、
一意制約とインデックスは早めに入れる価値があります。
