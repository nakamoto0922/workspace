# Backend API メモ

現状の backend で使える API をまとめたメモです。

ベースURL 例:

```txt
http://localhost:8787
```

---

## Health

### `GET /health`

アプリの基本ヘルスチェックです。

```json
{
  "status": "ok"
}
```

### `GET /health/db`

DB 接続込みのヘルスチェックです。

```json
{
  "status": "ok",
  "database": "ok"
}
```

---

## Skill Maps

### `GET /skill-maps`

スキルマップ一覧を返します。

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Web Frontend Starter",
    "version": 1,
    "nodeCount": 2,
    "edgeCount": 1,
    "createdAt": "2026-04-11T00:00:00.000Z",
    "updatedAt": "2026-04-11T00:00:00.000Z"
  }
]
```

### `POST /skill-maps`

スキルマップを作成します。

request:

```json
{
  "name": "React Learning Path",
  "version": 1
}
```

### `PATCH /skill-maps/:skillMapId`

スキルマップ名や version を更新します。

request:

```json
{
  "version": 2
}
```

### `GET /skill-maps/:skillMapId`

指定したスキルマップを返します。

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "name": "Web Frontend Starter",
  "version": 1,
  "createdAt": "2026-04-11T00:00:00.000Z",
  "updatedAt": "2026-04-11T00:00:00.000Z",
  "nodes": [
    {
      "id": "11111111-1111-1111-1111-111111111112",
      "code": "html-basics",
      "title": "HTML Basics",
      "description": "Learn the role of HTML and common document structure.",
      "kind": "tier1",
      "layout": {
        "column": 1,
        "row": 1
      },
      "unlock": {
        "mode": "all",
        "nodeIds": []
      },
      "difficulty": 1,
      "createdAt": "2026-04-11T00:00:00.000Z",
      "updatedAt": "2026-04-11T00:00:00.000Z"
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "fromNodeId": "11111111-1111-1111-1111-111111111112",
      "toNodeId": "11111111-1111-1111-1111-111111111113",
      "kind": "path"
    }
  ]
}
```

### `GET /skill-maps/:skillMapId/resolved?userId=:userId`

指定ユーザーの進捗を反映したノード状態つきマップを返します。

response の各 node には次が追加されます。

- `status`: `locked | available | completed`
- `incomingEdgeIds`
- `outgoingEdgeIds`

### `POST /skill-maps/:skillMapId/validate`

保存済みマップの整合性を検証します。

```json
{
  "isValid": true,
  "issues": []
}
```

### `POST /skill-maps/:skillMapId/nodes`

ノードを追加します。

request:

```json
{
  "code": "react-basics",
  "title": "React Basics",
  "description": "Learn components and props.",
  "kind": "tier2",
  "layoutColumn": 2,
  "layoutRow": 1,
  "unlockMode": "all",
  "difficulty": 2,
  "memo": "Optional note",
  "unlockNodeIds": [
    "11111111-1111-1111-1111-111111111112"
  ]
}
```

### `POST /skill-maps/:skillMapId/edges`

エッジを追加します。

request:

```json
{
  "fromNodeId": "node-a",
  "toNodeId": "node-b",
  "kind": "path"
}
```

---

## Skill Nodes

### `PATCH /skill-nodes/:skillNodeId`

ノードを更新します。

更新可能な主な項目:

- `code`
- `title`
- `description`
- `kind`
- `layoutColumn`
- `layoutRow`
- `unlockMode`
- `difficulty`
- `memo`
- `unlockNodeIds`

`memo` と `difficulty` は `null` でクリアできます。

### `DELETE /skill-nodes/:skillNodeId`

ノードを削除します。

```json
{
  "id": "skill-node-id",
  "skillMapId": "skill-map-id",
  "deleted": true
}
```

---

## Skill Edges

### `DELETE /skill-edges/:skillEdgeId`

エッジを削除します。

```json
{
  "id": "skill-edge-id",
  "skillMapId": "skill-map-id",
  "deleted": true
}
```

---

## Progress

### `POST /progress/:skillNodeId/complete`

ノードを完了扱いにします。

request:

```json
{
  "userId": "11111111-1111-1111-1111-111111111114",
  "skillMapId": "11111111-1111-1111-1111-111111111111"
}
```

response:

```json
{
  "userId": "11111111-1111-1111-1111-111111111114",
  "skillMapId": "11111111-1111-1111-1111-111111111111",
  "skillNodeId": "11111111-1111-1111-1111-111111111113",
  "completed": true,
  "completedAt": "2026-04-11T00:00:00.000Z"
}
```

### `DELETE /progress/:skillNodeId/complete`

完了状態を解除します。

request:

```json
{
  "userId": "11111111-1111-1111-1111-111111111114",
  "skillMapId": "11111111-1111-1111-1111-111111111111"
}
```

response:

```json
{
  "userId": "11111111-1111-1111-1111-111111111114",
  "skillMapId": "11111111-1111-1111-1111-111111111111",
  "skillNodeId": "11111111-1111-1111-1111-111111111113",
  "completed": false,
  "removed": true
}
```

---

## Users

### `GET /users`

ユーザー一覧を返します。

### `POST /users`

ユーザーを作成します。

request:

```json
{
  "name": "Demo User"
}
```

### `GET /users/:userId/progress`

ユーザー進捗を返します。

query:

- `skillMapId` は任意

response:

```json
{
  "userId": "11111111-1111-1111-1111-111111111114",
  "skillMapId": "11111111-1111-1111-1111-111111111111",
  "completedNodeIds": [
    "11111111-1111-1111-1111-111111111112"
  ],
  "totalCompleted": 1,
  "items": [
    {
      "skillMapId": "11111111-1111-1111-1111-111111111111",
      "skillNodeId": "11111111-1111-1111-1111-111111111112",
      "completedAt": "2026-04-11T00:00:00.000Z",
      "createdAt": "2026-04-11T00:00:00.000Z",
      "updatedAt": "2026-04-11T00:00:00.000Z"
    }
  ]
}
```

### `GET /users/:userId/skill-maps/:skillMapId`

ユーザー情報、スキルマップ、進捗をまとめて返します。

```json
{
  "user": {
    "id": "user-id",
    "name": "Demo User",
    "createdAt": "2026-04-11T00:00:00.000Z"
  },
  "skillMap": {
    "id": "skill-map-id",
    "name": "Web Frontend Starter",
    "version": 1,
    "createdAt": "2026-04-11T00:00:00.000Z",
    "updatedAt": "2026-04-11T00:00:00.000Z",
    "nodes": [],
    "edges": []
  },
  "progress": {
    "userId": "user-id",
    "skillMapId": "skill-map-id",
    "completedNodeIds": [],
    "totalCompleted": 0,
    "items": []
  }
}
```

---

## 開発用セットアップ

クリーンな DB から始めるときは次の順で十分です。

```bash
cd /workspace
npm run db:migrate --workspace backend
npm run db:seed --workspace backend
```

既存 DB を migration 履歴へ合わせたいときだけ、
必要に応じて `db:baseline` を使います。
