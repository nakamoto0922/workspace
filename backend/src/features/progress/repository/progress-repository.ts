import { and, asc, eq } from 'drizzle-orm'
import { BadRequestError, NotFoundError } from '../../../app/api-error.js'
import { db } from '../../../db/client.js'
import { skillMaps, skillNodes } from '../../../db/schema/skill-maps.js'
import {
  type NewUserSkillNodeProgressRow,
  userSkillNodeProgress,
  users,
} from '../../../db/schema/users.js'

export async function completeSkillNode(input: {
  userId: string
  skillMapId: string
  skillNodeId: string
}) {
  await ensureProgressInput(input)

  const completedAt = new Date()
  const values: NewUserSkillNodeProgressRow = {
    userId: input.userId,
    skillMapId: input.skillMapId,
    skillNodeId: input.skillNodeId,
    completedAt,
    updatedAt: completedAt,
  }

  await db
    .insert(userSkillNodeProgress)
    .values(values)
    .onConflictDoUpdate({
      target: [
        userSkillNodeProgress.userId,
        userSkillNodeProgress.skillMapId,
        userSkillNodeProgress.skillNodeId,
      ],
      set: {
        completedAt,
        updatedAt: completedAt,
      },
    })

  return {
    ...input,
    completed: true,
    completedAt: completedAt.toISOString(),
  }
}

export async function uncompleteSkillNode(input: {
  userId: string
  skillMapId: string
  skillNodeId: string
}) {
  await ensureProgressInput(input)

  const deletedRows = await db
    .delete(userSkillNodeProgress)
    .where(
      and(
        eq(userSkillNodeProgress.userId, input.userId),
        eq(userSkillNodeProgress.skillMapId, input.skillMapId),
        eq(userSkillNodeProgress.skillNodeId, input.skillNodeId),
      ),
    )
    .returning({
      id: userSkillNodeProgress.id,
    })

  return {
    ...input,
    completed: false,
    removed: deletedRows.length > 0,
  }
}

export async function getUserProgress(
  userId: string,
  skillMapId?: string,
) {
  await ensureUserExists(userId)

  if (skillMapId) {
    await ensureSkillMapExists(skillMapId)
  }

  const progressRows = await db
    .select({
      skillMapId: userSkillNodeProgress.skillMapId,
      skillNodeId: userSkillNodeProgress.skillNodeId,
      completedAt: userSkillNodeProgress.completedAt,
      createdAt: userSkillNodeProgress.createdAt,
      updatedAt: userSkillNodeProgress.updatedAt,
    })
    .from(userSkillNodeProgress)
    .where(
      skillMapId
        ? and(
            eq(userSkillNodeProgress.userId, userId),
            eq(userSkillNodeProgress.skillMapId, skillMapId),
          )
        : eq(userSkillNodeProgress.userId, userId),
    )
    .orderBy(
      asc(userSkillNodeProgress.skillMapId),
      asc(userSkillNodeProgress.completedAt),
      asc(userSkillNodeProgress.skillNodeId),
    )

  return {
    userId,
    skillMapId: skillMapId ?? null,
    completedNodeIds: progressRows.map((row) => row.skillNodeId),
    totalCompleted: progressRows.length,
    items: progressRows.map((row) => ({
      skillMapId: row.skillMapId,
      skillNodeId: row.skillNodeId,
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  }
}

export async function getCompletedNodeIds(userId: string, skillMapId: string) {
  await ensureUserExists(userId)
  await ensureSkillMapExists(skillMapId)

  const progressRows = await db
    .select({
      skillNodeId: userSkillNodeProgress.skillNodeId,
    })
    .from(userSkillNodeProgress)
    .where(
      and(
        eq(userSkillNodeProgress.userId, userId),
        eq(userSkillNodeProgress.skillMapId, skillMapId),
      ),
    )
    .orderBy(asc(userSkillNodeProgress.completedAt), asc(userSkillNodeProgress.skillNodeId))

  return progressRows.map((row) => row.skillNodeId)
}

async function ensureProgressInput(input: {
  userId: string
  skillMapId: string
  skillNodeId: string
}) {
  const [user, skillMap, skillNode] = await Promise.all([
    db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1),
    db
      .select({ id: skillMaps.id })
      .from(skillMaps)
      .where(eq(skillMaps.id, input.skillMapId))
      .limit(1),
    db
      .select({ id: skillNodes.id })
      .from(skillNodes)
      .where(
        and(
          eq(skillNodes.id, input.skillNodeId),
          eq(skillNodes.skillMapId, input.skillMapId),
        ),
      )
      .limit(1),
  ])

  if (!user[0]) {
    throw new NotFoundError('User not found.')
  }

  if (!skillMap[0]) {
    throw new NotFoundError('Skill map not found.')
  }

  if (!skillNode[0]) {
    throw new NotFoundError('Skill node not found in the specified skill map.')
  }
}

async function ensureUserExists(userId: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    throw new NotFoundError('User not found.')
  }
}

async function ensureSkillMapExists(skillMapId: string) {
  const [skillMap] = await db
    .select({ id: skillMaps.id })
    .from(skillMaps)
    .where(eq(skillMaps.id, skillMapId))
    .limit(1)

  if (!skillMap) {
    throw new NotFoundError('Skill map not found.')
  }
}

export function ensureSkillMapIdQuery(skillMapId?: string | null) {
  if (skillMapId === undefined || skillMapId === null || skillMapId.length === 0) {
    throw new BadRequestError('skillMapId query parameter is required.')
  }

  return skillMapId
}
