import { and, asc, count, eq, inArray } from 'drizzle-orm'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../../app/api-error.js'
import { db } from '../../../db/client.js'
import {
  type NewSkillEdgeRow,
  type NewSkillMapRow,
  type NewSkillNodeRow,
  type NewSkillNodeUnlockNodeRow,
  type SkillEdgeRow,
  type SkillMapRow,
  type SkillNodeRow,
  type SkillNodeUnlockNodeRow,
  skillEdges,
  skillMaps,
  skillNodeUnlockNodes,
  skillNodes,
} from '../../../db/schema/skill-maps.js'
import {
  SkillMapDetail,
  SkillMapEdge,
  SkillMapNode,
  SkillMapSummary,
} from '../model/skill-map.js'

export async function listSkillMaps(): Promise<SkillMapSummary[]> {
  const [mapRows, nodeCountRows, edgeCountRows] = await Promise.all([
    db.select().from(skillMaps).orderBy(asc(skillMaps.name), asc(skillMaps.version)),
    db
      .select({
        skillMapId: skillNodes.skillMapId,
        count: count(skillNodes.id),
      })
      .from(skillNodes)
      .groupBy(skillNodes.skillMapId),
    db
      .select({
        skillMapId: skillEdges.skillMapId,
        count: count(skillEdges.id),
      })
      .from(skillEdges)
      .groupBy(skillEdges.skillMapId),
  ])

  const nodeCountByMapId = new Map(
    nodeCountRows.map((row) => [row.skillMapId, Number(row.count)]),
  )
  const edgeCountByMapId = new Map(
    edgeCountRows.map((row) => [row.skillMapId, Number(row.count)]),
  )

  return mapRows.map((row) =>
    mapSkillMapSummary(
      row,
      nodeCountByMapId.get(row.id) ?? 0,
      edgeCountByMapId.get(row.id) ?? 0,
    ),
  )
}

export async function getSkillMapSummaryById(skillMapId: string) {
  const [skillMap, nodeCountRows, edgeCountRows] = await Promise.all([
    db.select().from(skillMaps).where(eq(skillMaps.id, skillMapId)).limit(1),
    db
      .select({
        count: count(skillNodes.id),
      })
      .from(skillNodes)
      .where(eq(skillNodes.skillMapId, skillMapId)),
    db
      .select({
        count: count(skillEdges.id),
      })
      .from(skillEdges)
      .where(eq(skillEdges.skillMapId, skillMapId)),
  ])

  if (!skillMap[0]) {
    return null
  }

  return mapSkillMapSummary(
    skillMap[0],
    Number(nodeCountRows[0]?.count ?? 0),
    Number(edgeCountRows[0]?.count ?? 0),
  )
}

export async function getSkillMapById(
  skillMapId: string,
): Promise<SkillMapDetail | null> {
  const skillMap = await getSkillMapBaseById(skillMapId)

  if (!skillMap) {
    return null
  }

  return buildSkillMapDetail(skillMap)
}

export async function createSkillMap(input: { name: string; version?: number }) {
  try {
    const values: NewSkillMapRow = {
      name: input.name,
      version: input.version ?? 1,
    }

    const [created] = await db
      .insert(skillMaps)
      .values(values)
      .returning({
        id: skillMaps.id,
      })

    return getSkillMapSummaryById(created.id)
  } catch (error) {
    if (hasPgErrorCode(error, '23505')) {
      throw new ConflictError('Skill map with the same name and version already exists.')
    }

    throw error
  }
}

export async function updateSkillMap(
  skillMapId: string,
  input: {
    name?: string
    version?: number
  },
) {
  const current = await getSkillMapBaseById(skillMapId)

  if (!current) {
    throw new NotFoundError('Skill map not found.')
  }

  if (input.name === undefined && input.version === undefined) {
    return getSkillMapSummaryById(skillMapId)
  }

  try {
    await db
      .update(skillMaps)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.version !== undefined ? { version: input.version } : {}),
        updatedAt: new Date(),
      })
      .where(eq(skillMaps.id, skillMapId))

    return getSkillMapSummaryById(skillMapId)
  } catch (error) {
    if (hasPgErrorCode(error, '23505')) {
      throw new ConflictError('Skill map with the same name and version already exists.')
    }

    throw error
  }
}

export async function createSkillNode(
  skillMapId: string,
  input: {
    code: string
    title: string
    description: string
    kind: string
    layoutColumn: number
    layoutRow: number
    unlockMode?: 'all' | 'any'
    difficulty?: number | null
    memo?: string | null
    unlockNodeIds?: string[]
  },
) {
  const unlockNodeIds = normalizeNodeIds(input.unlockNodeIds)

  try {
    const createdNodeId = await db.transaction(async (tx) => {
      const [skillMap] = await tx
        .select({ id: skillMaps.id })
        .from(skillMaps)
        .where(eq(skillMaps.id, skillMapId))
        .limit(1)

      if (!skillMap) {
        throw new NotFoundError('Skill map not found.')
      }

      await ensureNodesBelongToSkillMap(tx, skillMapId, unlockNodeIds, 'unlockNodeIds')

      const [createdNode] = await tx
        .insert(skillNodes)
        .values({
          skillMapId,
          code: input.code,
          title: input.title,
          description: input.description,
          kind: input.kind,
          layoutColumn: input.layoutColumn,
          layoutRow: input.layoutRow,
          unlockMode: input.unlockMode ?? 'all',
          difficulty: input.difficulty ?? null,
          memo: input.memo ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies NewSkillNodeRow)
        .returning({
          id: skillNodes.id,
        })

      if (unlockNodeIds.length > 0) {
        await tx.insert(skillNodeUnlockNodes).values(
          unlockNodeIds.map((requiredNodeId) => ({
            skillNodeId: createdNode.id,
            requiredNodeId,
          }) satisfies NewSkillNodeUnlockNodeRow),
        )
      }

      await tx
        .update(skillMaps)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(skillMaps.id, skillMapId))

      return createdNode.id
    })

    return getSkillNodeById(createdNodeId)
  } catch (error) {
    if (hasPgErrorCode(error, '23505')) {
      throw new ConflictError('Skill node with the same code already exists in the skill map.')
    }

    throw error
  }
}

export async function updateSkillNode(
  skillNodeId: string,
  input: {
    code?: string
    title?: string
    description?: string
    kind?: string
    layoutColumn?: number
    layoutRow?: number
    unlockMode?: 'all' | 'any'
    difficulty?: number | null
    memo?: string | null
    unlockNodeIds?: string[]
  },
) {
  const unlockNodeIds = input.unlockNodeIds
    ? normalizeNodeIds(input.unlockNodeIds)
    : undefined

  try {
    await db.transaction(async (tx) => {
      const [currentNode] = await tx
        .select({
          id: skillNodes.id,
          skillMapId: skillNodes.skillMapId,
        })
        .from(skillNodes)
        .where(eq(skillNodes.id, skillNodeId))
        .limit(1)

      if (!currentNode) {
        throw new NotFoundError('Skill node not found.')
      }

      if (unlockNodeIds?.includes(skillNodeId)) {
        throw new BadRequestError('unlockNodeIds cannot include the node itself.')
      }

      if (unlockNodeIds !== undefined) {
        await ensureNodesBelongToSkillMap(
          tx,
          currentNode.skillMapId,
          unlockNodeIds,
          'unlockNodeIds',
        )
      }

      const hasFieldUpdates = [
        input.code,
        input.title,
        input.description,
        input.kind,
        input.layoutColumn,
        input.layoutRow,
        input.unlockMode,
        input.difficulty,
        input.memo,
      ].some((value) => value !== undefined)

      if (hasFieldUpdates) {
        await tx
          .update(skillNodes)
          .set({
            ...(input.code !== undefined ? { code: input.code } : {}),
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.kind !== undefined ? { kind: input.kind } : {}),
            ...(input.layoutColumn !== undefined
              ? { layoutColumn: input.layoutColumn }
              : {}),
            ...(input.layoutRow !== undefined ? { layoutRow: input.layoutRow } : {}),
            ...(input.unlockMode !== undefined ? { unlockMode: input.unlockMode } : {}),
            ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
            ...(input.memo !== undefined ? { memo: input.memo } : {}),
            updatedAt: new Date(),
          })
          .where(eq(skillNodes.id, skillNodeId))
      }

      if (unlockNodeIds !== undefined) {
        await tx
          .delete(skillNodeUnlockNodes)
          .where(eq(skillNodeUnlockNodes.skillNodeId, skillNodeId))

        if (unlockNodeIds.length > 0) {
          await tx.insert(skillNodeUnlockNodes).values(
            unlockNodeIds.map((requiredNodeId) => ({
              skillNodeId,
              requiredNodeId,
            })),
          )
        }
      }

      await tx
        .update(skillMaps)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(skillMaps.id, currentNode.skillMapId))
    })

    return getSkillNodeById(skillNodeId)
  } catch (error) {
    if (hasPgErrorCode(error, '23505')) {
      throw new ConflictError('Skill node with the same code already exists in the skill map.')
    }

    throw error
  }
}

export async function deleteSkillNode(skillNodeId: string) {
  const [deletedNode] = await db
    .delete(skillNodes)
    .where(eq(skillNodes.id, skillNodeId))
    .returning({
      id: skillNodes.id,
      skillMapId: skillNodes.skillMapId,
    })

  if (!deletedNode) {
    throw new NotFoundError('Skill node not found.')
  }

  await db
    .update(skillMaps)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(skillMaps.id, deletedNode.skillMapId))

  return {
    id: deletedNode.id,
    skillMapId: deletedNode.skillMapId,
    deleted: true,
  }
}

export async function createSkillEdge(
  skillMapId: string,
  input: {
    fromNodeId: string
    toNodeId: string
    kind?: string
  },
) {
  if (input.fromNodeId === input.toNodeId) {
    throw new BadRequestError('fromNodeId and toNodeId must be different.')
  }

  try {
    const [createdEdge] = await db.transaction(async (tx) => {
      const [skillMap] = await tx
        .select({ id: skillMaps.id })
        .from(skillMaps)
        .where(eq(skillMaps.id, skillMapId))
        .limit(1)

      if (!skillMap) {
        throw new NotFoundError('Skill map not found.')
      }

      await ensureNodesBelongToSkillMap(
        tx,
        skillMapId,
        [input.fromNodeId, input.toNodeId],
        'fromNodeId/toNodeId',
      )

      const [edge] = await tx
        .insert(skillEdges)
        .values({
          skillMapId,
          fromNodeId: input.fromNodeId,
          toNodeId: input.toNodeId,
          kind: input.kind ?? 'path',
        } satisfies NewSkillEdgeRow)
        .returning({
          id: skillEdges.id,
          fromNodeId: skillEdges.fromNodeId,
          toNodeId: skillEdges.toNodeId,
          kind: skillEdges.kind,
        })

      await tx
        .update(skillMaps)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(skillMaps.id, skillMapId))

      return [edge]
    })

    return createdEdge
  } catch (error) {
    if (hasPgErrorCode(error, '23505')) {
      throw new ConflictError('Skill edge already exists in the skill map.')
    }

    throw error
  }
}

export async function deleteSkillEdge(skillEdgeId: string) {
  const [deletedEdge] = await db
    .delete(skillEdges)
    .where(eq(skillEdges.id, skillEdgeId))
    .returning({
      id: skillEdges.id,
      skillMapId: skillEdges.skillMapId,
    })

  if (!deletedEdge) {
    throw new NotFoundError('Skill edge not found.')
  }

  await db
    .update(skillMaps)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(skillMaps.id, deletedEdge.skillMapId))

  return {
    id: deletedEdge.id,
    skillMapId: deletedEdge.skillMapId,
    deleted: true,
  }
}

export async function getSkillNodeById(skillNodeId: string) {
  const [node] = await db.select().from(skillNodes).where(eq(skillNodes.id, skillNodeId)).limit(1)

  if (!node) {
    return null
  }

  const unlockRows = await db
    .select()
    .from(skillNodeUnlockNodes)
    .where(eq(skillNodeUnlockNodes.skillNodeId, skillNodeId))

  return mapSkillNode(node, unlockRows.map((row) => row.requiredNodeId))
}

async function getSkillMapBaseById(skillMapId: string) {
  const [skillMap] = await db.select().from(skillMaps).where(eq(skillMaps.id, skillMapId)).limit(1)

  return skillMap ?? null
}

async function buildSkillMapDetail(skillMap: SkillMapRow) {
  const [nodeRows, edgeRows] = await Promise.all([
    db
      .select()
      .from(skillNodes)
      .where(eq(skillNodes.skillMapId, skillMap.id))
      .orderBy(asc(skillNodes.layoutColumn), asc(skillNodes.layoutRow), asc(skillNodes.code)),
    db
      .select()
      .from(skillEdges)
      .where(eq(skillEdges.skillMapId, skillMap.id))
      .orderBy(asc(skillEdges.fromNodeId), asc(skillEdges.toNodeId), asc(skillEdges.id)),
  ])

  const unlockRows =
    nodeRows.length === 0
      ? []
      : await db
          .select()
          .from(skillNodeUnlockNodes)
          .where(inArray(skillNodeUnlockNodes.skillNodeId, nodeRows.map((row) => row.id)))

  return mapSkillMapDetail(skillMap, nodeRows, edgeRows, unlockRows)
}

async function ensureNodesBelongToSkillMap(
  tx: any,
  skillMapId: string,
  nodeIds: string[],
  fieldName: string,
) {
  if (nodeIds.length === 0) {
    return
  }

  const rows = await tx
    .select({
      id: skillNodes.id,
    })
    .from(skillNodes)
    .where(
      and(
        eq(skillNodes.skillMapId, skillMapId),
        inArray(skillNodes.id, nodeIds),
      ),
    )

  if (rows.length !== new Set(nodeIds).size) {
    throw new BadRequestError(
      `${fieldName} contains node ids that do not belong to the specified skill map.`,
    )
  }
}

function mapSkillMapSummary(
  row: SkillMapRow,
  nodeCount: number,
  edgeCount: number,
): SkillMapSummary {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    nodeCount,
    edgeCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapSkillMapDetail(
  skillMap: SkillMapRow,
  nodeRows: SkillNodeRow[],
  edgeRows: SkillEdgeRow[],
  unlockRows: SkillNodeUnlockNodeRow[],
): SkillMapDetail {
  const unlockNodeIdsByNodeId = new Map<string, string[]>()

  for (const unlockRow of unlockRows) {
    const ids = unlockNodeIdsByNodeId.get(unlockRow.skillNodeId) ?? []
    ids.push(unlockRow.requiredNodeId)
    unlockNodeIdsByNodeId.set(unlockRow.skillNodeId, ids)
  }

  return {
    id: skillMap.id,
    name: skillMap.name,
    version: skillMap.version,
    createdAt: skillMap.createdAt.toISOString(),
    updatedAt: skillMap.updatedAt.toISOString(),
    nodes: nodeRows.map((node) =>
      mapSkillNode(node, unlockNodeIdsByNodeId.get(node.id) ?? []),
    ),
    edges: edgeRows.map((edge) => mapSkillEdge(edge)),
  }
}

function mapSkillNode(node: SkillNodeRow, unlockNodeIds: string[]): SkillMapNode {
  return {
    id: node.id,
    code: node.code,
    title: node.title,
    description: node.description,
    kind: node.kind,
    layout: {
      column: node.layoutColumn,
      row: node.layoutRow,
    },
    unlock: {
      mode: node.unlockMode === 'any' ? 'any' : 'all',
      nodeIds: unlockNodeIds,
    },
    ...(node.difficulty !== null ? { difficulty: node.difficulty } : {}),
    ...(node.memo !== null ? { memo: node.memo } : {}),
    createdAt: node.createdAt.toISOString(),
    updatedAt: node.updatedAt.toISOString(),
  }
}

function mapSkillEdge(edge: SkillEdgeRow): SkillMapEdge {
  return {
    id: edge.id,
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId,
    kind: edge.kind,
  }
}

function normalizeNodeIds(nodeIds?: string[]) {
  return [...new Set(nodeIds ?? [])]
}

function hasPgErrorCode(error: unknown, expectedCode: string) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {
    code?: string
    cause?: {
      code?: string
    }
  }

  return candidate.code === expectedCode || candidate.cause?.code === expectedCode
}
