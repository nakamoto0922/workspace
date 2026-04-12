import type {
  ResolvedSkillMapDetail,
  SkillMapDetail,
  SkillMapIssue,
  SkillMapNode,
  SkillMapValidation,
} from '@workspace/contracts'

export type {
  ResolvedSkillMapDetail,
  SkillMapDetail,
  SkillMapEdge,
  SkillMapIssue,
  SkillMapNode,
  SkillMapSummary,
  SkillMapValidation,
} from '@workspace/contracts'

export function validateSkillMap(map: SkillMapDetail): SkillMapValidation {
  const issues: SkillMapIssue[] = []
  const nodeIds = new Set<string>()
  const edgeIds = new Set<string>()

  for (const node of map.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push({
        code: 'DUPLICATE_NODE_ID',
        nodeId: node.id,
        message: `Duplicate skill node id: ${node.id}`,
      })
    }

    nodeIds.add(node.id)
  }

  for (const edge of map.edges) {
    if (edgeIds.has(edge.id)) {
      issues.push({
        code: 'DUPLICATE_EDGE_ID',
        edgeId: edge.id,
        message: `Duplicate skill edge id: ${edge.id}`,
      })
    }

    edgeIds.add(edge.id)
  }

  for (const node of map.nodes) {
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

  for (const edge of map.edges) {
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
  map: SkillMapDetail,
  completedNodeIds: string[],
): ResolvedSkillMapDetail {
  const completedNodeIdSet = new Set(completedNodeIds)
  const edgesByNode = buildEdgesByNode(map)

  return {
    ...map,
    completedNodeIds: [...completedNodeIds],
    nodes: map.nodes.map((node) => {
      const isCompleted = completedNodeIdSet.has(node.id)
      const status = isCompleted
        ? 'completed'
        : isNodeUnlocked(node, completedNodeIdSet)
          ? 'available'
          : 'locked'

      return {
        ...node,
        status,
        incomingEdgeIds: edgesByNode.incoming.get(node.id) ?? [],
        outgoingEdgeIds: edgesByNode.outgoing.get(node.id) ?? [],
      }
    }),
  }
}

function buildEdgesByNode(map: SkillMapDetail) {
  const incoming = new Map<string, string[]>()
  const outgoing = new Map<string, string[]>()

  for (const edge of map.edges) {
    const nextIncoming = incoming.get(edge.toNodeId) ?? []
    nextIncoming.push(edge.id)
    incoming.set(edge.toNodeId, nextIncoming)

    const nextOutgoing = outgoing.get(edge.fromNodeId) ?? []
    nextOutgoing.push(edge.id)
    outgoing.set(edge.fromNodeId, nextOutgoing)
  }

  return {
    incoming,
    outgoing,
  }
}

function isNodeUnlocked(node: SkillMapNode, completedNodeIds: Set<string>) {
  if (node.unlock.nodeIds.length === 0) {
    return true
  }

  if (node.unlock.mode === 'all') {
    return node.unlock.nodeIds.every((nodeId) => completedNodeIds.has(nodeId))
  }

  return node.unlock.nodeIds.some((nodeId) => completedNodeIds.has(nodeId))
}

function detectUnlockCycles(map: SkillMapDetail): SkillMapIssue[] {
  const issues: SkillMapIssue[] = []
  const nodesById = new Map(map.nodes.map((node) => [node.id, node]))
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function visit(nodeId: string, path: string[]) {
    if (visiting.has(nodeId)) {
      issues.push({
        code: 'UNLOCK_CYCLE',
        nodeId,
        message: `Unlock cycle detected: ${[...path, nodeId].join(' -> ')}`,
      })
      return
    }

    if (visited.has(nodeId)) {
      return
    }

    visiting.add(nodeId)

    for (const dependencyNodeId of nodesById.get(nodeId)?.unlock.nodeIds ?? []) {
      if (nodesById.has(dependencyNodeId)) {
        visit(dependencyNodeId, [...path, nodeId])
      }
    }

    visiting.delete(nodeId)
    visited.add(nodeId)
  }

  for (const node of map.nodes) {
    visit(node.id, [])
  }

  return issues
}
