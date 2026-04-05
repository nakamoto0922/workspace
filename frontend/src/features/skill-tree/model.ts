export type SkillNodeId = string
export type SkillEdgeId = string

export const SKILL_NODE_KINDS = [
  'tier1',
  'tier2',
  'tier3',
  'tier4',
  'tier5',
] as const

export type SkillNodeKind = (typeof SKILL_NODE_KINDS)[number]
export type SkillNodeStatus = 'locked' | 'available' | 'completed'

export type UnlockCondition = {
  mode: 'all' | 'any'
  nodeIds: SkillNodeId[]
}

export type SkillNode = {
  id: SkillNodeId
  title: string
  description: string
  kind: SkillNodeKind
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

export type SkillEdge = {
  id: SkillEdgeId
  fromNodeId: SkillNodeId
  toNodeId: SkillNodeId
  kind: 'path'
}

export type SkillMap = {
  version: 2
  nodes: Record<SkillNodeId, SkillNode>
  edges: Record<SkillEdgeId, SkillEdge>
}

export type SkillMapIssue = {
  code:
    | 'DUPLICATE_NODE_ID'
    | 'DUPLICATE_EDGE_ID'
    | 'MISSING_EDGE_SOURCE'
    | 'MISSING_EDGE_TARGET'
    | 'MISSING_UNLOCK_NODE'
    | 'SELF_UNLOCK'
    | 'SELF_EDGE'
    | 'UNLOCK_CYCLE'
  nodeId?: SkillNodeId
  edgeId?: SkillEdgeId
  message: string
}

export type SkillMapValidation = {
  isValid: boolean
  issues: SkillMapIssue[]
}

export type SkillMapState = {
  completedNodeIds: SkillNodeId[]
}

export type ResolvedSkillNode = SkillNode & {
  status: SkillNodeStatus
  incomingEdgeIds: SkillEdgeId[]
  outgoingEdgeIds: SkillEdgeId[]
}

export function createSkillMap(input: {
  nodes: SkillNode[]
  edges?: SkillEdge[]
}): SkillMap {
  const nodeMap = new Map<SkillNodeId, SkillNode>()
  const edgeMap = new Map<SkillEdgeId, SkillEdge>()

  for (const node of input.nodes) {
    if (nodeMap.has(node.id)) {
      throw new Error(`Duplicate skill node id: ${node.id}`)
    }

    nodeMap.set(node.id, {
      ...node,
      unlock: {
        mode: node.unlock.mode,
        nodeIds: [...node.unlock.nodeIds],
      },
      tags: node.tags ? [...node.tags] : undefined,
      referenceLinks: node.referenceLinks ? [...node.referenceLinks] : undefined,
    })
  }

  for (const edge of input.edges ?? []) {
    if (edgeMap.has(edge.id)) {
      throw new Error(`Duplicate skill edge id: ${edge.id}`)
    }

    edgeMap.set(edge.id, { ...edge })
  }

  return {
    version: 2,
    nodes: Object.fromEntries(nodeMap),
    edges: Object.fromEntries(edgeMap),
  }
}

export function validateSkillMap(map: SkillMap): SkillMapValidation {
  const issues: SkillMapIssue[] = []
  const nodeIds = new Set(Object.keys(map.nodes))

  for (const node of Object.values(map.nodes)) {
    for (const unlockNodeId of node.unlock.nodeIds) {
      if (unlockNodeId === node.id) {
        issues.push({
          code: 'SELF_UNLOCK',
          nodeId: node.id,
          message: 'Node cannot unlock itself.',
        })
      }

      if (!nodeIds.has(unlockNodeId)) {
        issues.push({
          code: 'MISSING_UNLOCK_NODE',
          nodeId: node.id,
          message: `Unlock node does not exist: ${unlockNodeId}`,
        })
      }
    }
  }

  for (const edge of Object.values(map.edges)) {
    if (edge.fromNodeId === edge.toNodeId) {
      issues.push({
        code: 'SELF_EDGE',
        edgeId: edge.id,
        message: 'Edge cannot point to the same node.',
      })
    }

    if (!nodeIds.has(edge.fromNodeId)) {
      issues.push({
        code: 'MISSING_EDGE_SOURCE',
        edgeId: edge.id,
        message: `Edge source does not exist: ${edge.fromNodeId}`,
      })
    }

    if (!nodeIds.has(edge.toNodeId)) {
      issues.push({
        code: 'MISSING_EDGE_TARGET',
        edgeId: edge.id,
        message: `Edge target does not exist: ${edge.toNodeId}`,
      })
    }
  }

  issues.push(...detectUnlockCycles(map))

  return {
    isValid: issues.length === 0,
    issues,
  }
}

export function resolveSkillMap(
  map: SkillMap,
  state: SkillMapState,
): Record<SkillNodeId, ResolvedSkillNode> {
  const completedNodeIds = new Set(state.completedNodeIds)
  const edgesByNode = buildEdgesByNode(map)

  return Object.fromEntries(
    Object.values(map.nodes).map((node) => {
      const isCompleted = completedNodeIds.has(node.id)
      const status = isCompleted
        ? 'completed'
        : isNodeUnlocked(node, completedNodeIds)
          ? 'available'
          : 'locked'

      return [
        node.id,
        {
          ...node,
          status,
          incomingEdgeIds: edgesByNode.incoming.get(node.id) ?? [],
          outgoingEdgeIds: edgesByNode.outgoing.get(node.id) ?? [],
        },
      ] as const
    }),
  )
}

export function getAvailableNodeIds(
  map: SkillMap,
  state: SkillMapState,
): SkillNodeId[] {
  return getNodesInLayoutOrder(map)
    .filter((node) => resolveSkillMap(map, state)[node.id]?.status === 'available')
    .map((node) => node.id)
}

export function getNodesInLayoutOrder(map: SkillMap): SkillNode[] {
  return Object.values(map.nodes).sort(compareNodesByLayout)
}

export const sampleSkillMap = createSkillMap({
  nodes: [
    {
      id: 'start-web',
      title: 'Web開発スタート',
      description: '最初の基点になる大ノード。',
      kind: 'tier1',
      layout: { column: 0, row: 1 },
      unlock: { mode: 'all', nodeIds: [] },
    },
    {
      id: 'minor-html',
      title: 'HTMLを書く',
      description: 'ページの骨組みを作る。',
      kind: 'tier3',
      layout: { column: 1, row: 0 },
      unlock: { mode: 'all', nodeIds: ['start-web'] },
    },
    {
      id: 'minor-css',
      title: 'CSSで見た目を整える',
      description: '基本的な装飾を行う。',
      kind: 'tier3',
      layout: { column: 1, row: 1 },
      unlock: { mode: 'all', nodeIds: ['start-web'] },
    },
    {
      id: 'minor-js',
      title: 'JavaScriptで動きをつける',
      description: 'インタラクションを追加する。',
      kind: 'tier3',
      layout: { column: 1, row: 2 },
      unlock: { mode: 'all', nodeIds: ['start-web'] },
    },
    {
      id: 'major-react',
      title: 'React基礎',
      description: '次の大ノード。間の小ノードは横並び。',
      kind: 'tier1',
      layout: { column: 2, row: 1 },
      unlock: { mode: 'any', nodeIds: ['minor-html', 'minor-css', 'minor-js'] },
    },
    {
      id: 'minor-props',
      title: 'propsで値を渡す',
      description: 'Reactの小ノード1。',
      kind: 'tier4',
      layout: { column: 3, row: 0 },
      unlock: { mode: 'all', nodeIds: ['major-react'] },
    },
    {
      id: 'minor-state',
      title: 'useStateで状態を持つ',
      description: 'Reactの小ノード2。',
      kind: 'tier4',
      layout: { column: 3, row: 1 },
      unlock: { mode: 'all', nodeIds: ['major-react'] },
    },
    {
      id: 'minor-fetch',
      title: 'fetchでAPI結果を表示する',
      description: 'Reactの小ノード3。',
      kind: 'tier4',
      layout: { column: 3, row: 2 },
      unlock: { mode: 'all', nodeIds: ['major-react'] },
    },
    {
      id: 'major-project',
      title: '小さなアプリを作る',
      description: 'Reactノード群の先にある次の大ノード。',
      kind: 'tier2',
      layout: { column: 4, row: 1 },
      unlock: {
        mode: 'any',
        nodeIds: ['minor-props', 'minor-state', 'minor-fetch'],
      },
    },
    {
      id: 'minor-router',
      title: '画面遷移を作る',
      description: 'React基礎から派生する別ルートの小ノード。',
      kind: 'tier4',
      layout: { column: 3, row: 3 },
      unlock: { mode: 'all', nodeIds: ['major-react'] },
    },
    {
      id: 'minor-form',
      title: 'フォームを組み立てる',
      description: 'React基礎から派生する別ルートの小ノード。',
      kind: 'tier4',
      layout: { column: 3, row: 4 },
      unlock: { mode: 'all', nodeIds: ['major-react'] },
    },
  ],
  edges: [
    {
      id: 'edge-start-html',
      fromNodeId: 'start-web',
      toNodeId: 'minor-html',
      kind: 'path',
    },
    {
      id: 'edge-start-css',
      fromNodeId: 'start-web',
      toNodeId: 'minor-css',
      kind: 'path',
    },
    {
      id: 'edge-start-js',
      fromNodeId: 'start-web',
      toNodeId: 'minor-js',
      kind: 'path',
    },
    {
      id: 'edge-html-react',
      fromNodeId: 'minor-html',
      toNodeId: 'major-react',
      kind: 'path',
    },
    {
      id: 'edge-css-react',
      fromNodeId: 'minor-css',
      toNodeId: 'major-react',
      kind: 'path',
    },
    {
      id: 'edge-js-react',
      fromNodeId: 'minor-js',
      toNodeId: 'major-react',
      kind: 'path',
    },
    {
      id: 'edge-react-props',
      fromNodeId: 'major-react',
      toNodeId: 'minor-props',
      kind: 'path',
    },
    {
      id: 'edge-react-state',
      fromNodeId: 'major-react',
      toNodeId: 'minor-state',
      kind: 'path',
    },
    {
      id: 'edge-react-fetch',
      fromNodeId: 'major-react',
      toNodeId: 'minor-fetch',
      kind: 'path',
    },
    {
      id: 'edge-react-router',
      fromNodeId: 'major-react',
      toNodeId: 'minor-router',
      kind: 'path',
    },
    {
      id: 'edge-react-form',
      fromNodeId: 'major-react',
      toNodeId: 'minor-form',
      kind: 'path',
    },
    {
      id: 'edge-props-project',
      fromNodeId: 'minor-props',
      toNodeId: 'major-project',
      kind: 'path',
    },
    {
      id: 'edge-state-project',
      fromNodeId: 'minor-state',
      toNodeId: 'major-project',
      kind: 'path',
    },
    {
      id: 'edge-fetch-project',
      fromNodeId: 'minor-fetch',
      toNodeId: 'major-project',
      kind: 'path',
    },
  ],
})

function isNodeUnlocked(node: SkillNode, completedNodeIds: Set<SkillNodeId>) {
  if (node.unlock.nodeIds.length === 0) {
    return true
  }

  if (node.unlock.mode === 'all') {
    return node.unlock.nodeIds.every((nodeId) => completedNodeIds.has(nodeId))
  }

  return node.unlock.nodeIds.some((nodeId) => completedNodeIds.has(nodeId))
}

function buildEdgesByNode(map: SkillMap) {
  const incoming = new Map<SkillNodeId, SkillEdgeId[]>()
  const outgoing = new Map<SkillNodeId, SkillEdgeId[]>()

  for (const edge of Object.values(map.edges)) {
    const incomingEdges = incoming.get(edge.toNodeId) ?? []
    incomingEdges.push(edge.id)
    incoming.set(edge.toNodeId, incomingEdges)

    const outgoingEdges = outgoing.get(edge.fromNodeId) ?? []
    outgoingEdges.push(edge.id)
    outgoing.set(edge.fromNodeId, outgoingEdges)
  }

  return { incoming, outgoing }
}

function detectUnlockCycles(map: SkillMap): SkillMapIssue[] {
  const issues: SkillMapIssue[] = []
  const visited = new Set<SkillNodeId>()
  const inStack = new Set<SkillNodeId>()

  function visit(nodeId: SkillNodeId) {
    if (inStack.has(nodeId)) {
      issues.push({
        code: 'UNLOCK_CYCLE',
        nodeId,
        message: `Unlock cycle detected from node: ${nodeId}`,
      })
      return
    }

    if (visited.has(nodeId)) {
      return
    }

    visited.add(nodeId)
    inStack.add(nodeId)

    for (const dependencyNodeId of map.nodes[nodeId]?.unlock.nodeIds ?? []) {
      if (map.nodes[dependencyNodeId]) {
        visit(dependencyNodeId)
      }
    }

    inStack.delete(nodeId)
  }

  for (const nodeId of Object.keys(map.nodes)) {
    visit(nodeId)
  }

  return uniqueIssues(issues)
}

function uniqueIssues(issues: SkillMapIssue[]): SkillMapIssue[] {
  const seen = new Set<string>()

  return issues.filter((issue) => {
    const key = `${issue.code}:${issue.nodeId ?? ''}:${issue.edgeId ?? ''}`
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function compareNodesByLayout(left: SkillNode, right: SkillNode) {
  if (left.layout.column !== right.layout.column) {
    return left.layout.column - right.layout.column
  }

  if (left.layout.row !== right.layout.row) {
    return left.layout.row - right.layout.row
  }

  if (left.kind !== right.kind) {
    return getNodeKindLevel(left.kind) - getNodeKindLevel(right.kind)
  }

  return left.title.localeCompare(right.title, 'ja')
}

function getNodeKindLevel(kind: SkillNodeKind) {
  return SKILL_NODE_KINDS.indexOf(kind)
}
