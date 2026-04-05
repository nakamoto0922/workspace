# スキルマップ データ構造メモ

このドキュメントは、`src/features/skill-tree/model.ts` で定義している
ゲーム風スキルマップのデータ構造について、
各プロパティの意味を整理したものです。

本アプリのスキルマップは、単純な親子ツリーではなく、
**「ノード」と「接続線」と「解放条件」を分けて持つ構造**です。

これにより、

- 大ノードと小ノードを見た目上自由に配置できる
- 大ノード間に小ノードを横並びで置ける
- 「どれか1つ達成したら次が解放」のような条件を表現できる

という特徴を持たせています。

---

## 1. 全体構造

全体は `SkillMap` で表します。

```ts
type SkillMap = {
  version: 2
  nodes: Record<SkillNodeId, SkillNode>
  edges: Record<SkillEdgeId, SkillEdge>
}
```

### `version`
データ構造のバージョンです。

- 将来データ形式を変更したときに、移行処理を書きやすくするために持たせます
- 現在は `2`

### `nodes`
スキルノード本体の一覧です。

- キーはノードID
- 値は `SkillNode`
- 実際の学習項目はすべてここに入ります

### `edges`
ノード同士を結ぶ線の一覧です。

- キーはエッジID
- 値は `SkillEdge`
- これは主に「見た目上どことどこをつなぐか」を表します

重要なのは、
**線があることと、解放条件を満たしていることは別**だという点です。

---

## 2. ノードID

```ts
type SkillNodeId = string
```

ノードを一意に識別するためのIDです。

- 例: `start-web`, `major-react`, `minor-css`
- タイトルではなくIDで参照します
- 解放条件や接続線は、このIDを使ってノードを指します

IDは後からタイトルが変わっても壊れないように、
**安定した文字列**にしておくのが前提です。

---

## 3. ノード本体 `SkillNode`

```ts
type SkillNode = {
  id: SkillNodeId
  title: string
  description: string
  kind: 'major' | 'minor'
  layout: {
    column: number
    row: number
  }
  unlock: UnlockCondition
  tags?: string[]
  referenceLinks?: string[]
  memo?: string
  difficulty?: 1 | 2 | 3 | 4 | 5
  createdAt?: string
  updatedAt?: string
}
```

### `id`
ノードの一意な識別子です。

- 他ノードやエッジから参照される基準
- 重複不可

### `title`
画面に表示するノード名です。

- 例: `React基礎`
- 例: `useStateで状態を持つ`

### `description`
ノードの説明文です。

- 何を学ぶノードなのか
- どの程度できれば達成なのか

を補足する用途です。

### `kind`
ノードの見た目上の種類です。

- `major`: 大ノード
- `minor`: 小ノード

使い分けのイメージ:

- `major`: 節目になる大きな学習テーマ
- `minor`: その間をつなぐ具体的な学習項目

この区別は主にUI表現のためのものです。
解放条件そのものは `kind` ではなく `unlock` で決まります。

### `layout`
ノードを画面上のどこに置くかを表します。

```ts
layout: {
  column: number
  row: number
}
```

#### `layout.column`
横方向の位置です。

- 数字が小さいほど左
- 数字が大きいほど右

例:

- 開始ノードを `column: 0`
- その次の小ノード群を `column: 1`
- さらに次の大ノードを `column: 2`

という形で並べられます。

#### `layout.row`
縦方向の位置です。

- 数字が小さいほど上
- 数字が大きいほど下

同じ列の中で、ノードを縦に並べるために使います。

例:

- `minor-html`: `row: 0`
- `minor-css`: `row: 1`
- `minor-js`: `row: 2`

とすると、小ノードを横並びの列の中で縦に配置できます。

### `unlock`
そのノードが解放される条件です。

見た目の接続線とは別に、
**実際に何を達成したらこのノードが開くか**をここで定義します。

詳細は後述の `UnlockCondition` を参照してください。

### `tags`
任意の分類ラベルです。

- 例: `['react', 'frontend']`
- フィルタや検索用に使えます

### `referenceLinks`
参考資料のURL一覧です。

- 公式ドキュメント
- 学習記事
- 動画

などを持たせる用途です。

### `memo`
自由記述メモです。

- 学習時の気づき
- 補足メモ
- 達成条件の自分用メモ

などを書けます。

### `difficulty`
難易度の目安です。

- `1` から `5`
- あくまで目安であり、解放条件には直接使いません

### `createdAt`
作成日時です。

- 将来、並び替えや履歴表示に使えるようにするための任意情報です

### `updatedAt`
更新日時です。

- 編集履歴や同期処理で役立つ可能性があります

---

## 4. 解放条件 `UnlockCondition`

```ts
type UnlockCondition = {
  mode: 'all' | 'any'
  nodeIds: SkillNodeId[]
}
```

ノードが `locked` から `available` になる条件を表します。

### `mode`
条件の評価方法です。

- `all`: 指定ノードをすべて完了したら解放
- `any`: 指定ノードのどれか1つを完了したら解放

#### `all` の例

```ts
unlock: {
  mode: 'all',
  nodeIds: ['task-html', 'task-css']
}
```

意味:

- HTMLもCSSも両方終わったら次が開く

#### `any` の例

```ts
unlock: {
  mode: 'any',
  nodeIds: ['minor-html', 'minor-css', 'minor-js']
}
```

意味:

- 3つのうちどれか1つ終われば次が開く

この `any` が、
今回イメージされている
**「大ノード間に横並びの小ノードを置き、どこからでも解放できる感じ」**
を作るための重要な仕組みです。

### `nodeIds`
解放条件に使うノードIDの配列です。

- ここに書かれたノードの完了状態を見て判定します
- 存在しないIDを入れてはいけません

### `nodeIds` が空配列のとき

```ts
unlock: {
  mode: 'all',
  nodeIds: []
}
```

この場合は、開始ノードとして扱います。

- 前提条件なし
- 最初から `available`

---

## 5. エッジ `SkillEdge`

```ts
type SkillEdge = {
  id: SkillEdgeId
  fromNodeId: SkillNodeId
  toNodeId: SkillNodeId
  kind: 'path'
}
```

エッジは、ノード同士をどうつなぐかを表します。

### `id`
エッジの一意な識別子です。

- 重複不可

### `fromNodeId`
線の始点になるノードIDです。

### `toNodeId`
線の終点になるノードIDです。

### `kind`
エッジの種類です。

現状は `path` のみです。

- `path`: 通常の接続線

将来的に、

- 推奨ルート
- 補助ルート
- 隠しルート

のような表現を増やしたくなったら拡張できます。

### エッジの役割

エッジは基本的に**見た目の接続関係**を表します。

つまり、

- `A` と `B` の間に線を引きたい
- 大ノードと小ノードのつながりを見せたい

という用途です。

注意:

- エッジがあるだけでは解放されません
- 実際の解放条件は `unlock` で決まります

---

## 6. 状態 `SkillNodeStatus`

```ts
type SkillNodeStatus = 'locked' | 'available' | 'completed'
```

ノードの現在状態です。

### `locked`
まだ着手できない状態です。

- 解放条件を満たしていない

### `available`
着手可能な状態です。

- 解放条件は満たした
- まだ完了していない

### `completed`
完了済みの状態です。

- ユーザーが達成済みとしてチェックした状態

重要なのは、
この状態は `SkillNode` 本体に固定保存するのではなく、
**完了済みIDと解放条件から導出する**ことです。

---

## 7. 状態管理 `SkillMapState`

```ts
type SkillMapState = {
  completedNodeIds: SkillNodeId[]
}
```

ユーザーの進行状況を表します。

### `completedNodeIds`
完了済みノードIDの一覧です。

- この配列に入っているノードは `completed`
- 入っていなくて、解放条件を満たすノードは `available`
- それ以外は `locked`

つまり、

- マップ本体: 学習構造
- 状態: ユーザーの進捗

を分離しています。

この分離により、

- 同じスキルマップを複数ユーザーで共有できる
- マップ編集と進捗保存を分けられる
- 状態計算をシンプルに保てる

という利点があります。

---

## 8. 解決済みノード `ResolvedSkillNode`

```ts
type ResolvedSkillNode = SkillNode & {
  status: SkillNodeStatus
  incomingEdgeIds: SkillEdgeId[]
  outgoingEdgeIds: SkillEdgeId[]
}
```

画面描画などで使いやすいように、
元のノード情報に計算済み情報を足した形です。

### `status`
現在の解放状態です。

- `locked`
- `available`
- `completed`

### `incomingEdgeIds`
このノードに入ってくる線のID一覧です。

- どのノードからつながっているかを把握するのに使います

### `outgoingEdgeIds`
このノードから出ていく線のID一覧です。

- 次にどこへつながるかを把握するのに使います

---

## 9. サンプル構造の読み方

現在のサンプルでは、次のような構造を想定しています。

- `start-web`
  - 最初の大ノード
- `minor-html`, `minor-css`, `minor-js`
  - 次の列に並ぶ小ノード群
- `major-react`
  - その先にある大ノード
  - 小ノード3つのうちどれか1つ完了で解放

つまり、

- 線としては「大 -> 小 -> 大」とつながって見える
- ただし間の小ノードは一直線ではなく横並び
- さらに解放条件は `any` なので、どの小ノードからでも先に進める

という形です。

---

## 10. この構造の意図

このデータ構造では、以下を両立したいと考えています。

- 見た目はゲームのスキルツリーらしくしたい
- でも学習項目は一直線ではなく、複数の入口を持たせたい
- 接続線と解放条件を分けて、柔軟に設計したい

特に重要なのは次の2点です。

- `edges`: 見た目上どうつながるか
- `unlock`: 実際に何を達成したら解放されるか

この2つを分けることで、
見た目の気持ちよさと、学習設計の柔軟性を両立しやすくなります。
