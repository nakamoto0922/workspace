import { asc, eq } from 'drizzle-orm'
import { db } from '../../../db/client.js'
import { type NewUserRow, users } from '../../../db/schema/users.js'
import { UserSummary } from '../model/user.js'

export async function listUsers(): Promise<UserSummary[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt), asc(users.name))

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function getUserById(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  }
}

export async function createUser(input: { name: string }) {
  const values: NewUserRow = {
    name: input.name,
  }

  const [user] = await db
    .insert(users)
    .values(values)
    .returning({
      id: users.id,
      name: users.name,
      createdAt: users.createdAt,
    })

  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  }
}
