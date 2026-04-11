import type { SkillMapDetail } from '../api/contracts'
import { SKILL_NODE_KINDS } from './model'
import type { SkillMap, SkillNode, SkillNodeKind } from './model'

export function mapApiSkillMapToClient(detail: SkillMapDetail): SkillMap {
  return {
    version: detail.version,
    nodes: Object.fromEntries(
      detail.nodes.map((node) => [
        node.id,
        {
          id: node.id,
          title: node.title,
          description: node.description,
          kind: normalizeNodeKind(node.kind),
          layout: {
            column: node.layout.column,
            row: node.layout.row,
          },
          unlock: {
            mode: node.unlock.mode,
            nodeIds: [...node.unlock.nodeIds],
          },
          memo: node.memo,
          difficulty: normalizeDifficulty(node.difficulty),
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
        } satisfies SkillNode,
      ]),
    ),
    edges: Object.fromEntries(
      detail.edges.map((edge) => [
        edge.id,
        {
          id: edge.id,
          fromNodeId: edge.fromNodeId,
          toNodeId: edge.toNodeId,
          kind: 'path' as const,
        },
      ]),
    ),
  }
}

function normalizeNodeKind(kind: string): SkillNodeKind {
  if (SKILL_NODE_KINDS.includes(kind as SkillNodeKind)) {
    return kind as SkillNodeKind
  }

  return 'tier3'
}

function normalizeDifficulty(
  value: number | undefined,
): SkillNode['difficulty'] {
  if (value === undefined) {
    return undefined
  }

  if (value < 1 || value > 5) {
    return undefined
  }

  return value as SkillNode['difficulty']
}
