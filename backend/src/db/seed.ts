import { db, pool } from './client.js'
import {
  skillEdges,
  skillMaps,
  skillNodeUnlockNodes,
  skillNodes,
} from './schema/skill-maps.js'
import { userSkillNodeProgress, users } from './schema/users.js'

const ids = {
  skillMapId: '11111111-1111-1111-1111-111111111111',
  htmlNodeId: '11111111-1111-1111-1111-111111111112',
  cssNodeId: '11111111-1111-1111-1111-111111111113',
  userId: '11111111-1111-1111-1111-111111111114',
}

async function main() {
  await db
    .insert(skillMaps)
    .values({
      id: ids.skillMapId,
      name: 'Web Frontend Starter',
      version: 1,
    })
    .onConflictDoNothing()

  await db
    .insert(skillNodes)
    .values([
      {
        id: ids.htmlNodeId,
        skillMapId: ids.skillMapId,
        code: 'html-basics',
        title: 'HTML Basics',
        description: 'Learn the role of HTML and common document structure.',
        kind: 'tier1',
        layoutColumn: 1,
        layoutRow: 1,
        unlockMode: 'all',
        difficulty: 1,
      },
      {
        id: ids.cssNodeId,
        skillMapId: ids.skillMapId,
        code: 'css-basics',
        title: 'CSS Basics',
        description: 'Learn selectors, box model, and basic layout styling.',
        kind: 'tier2',
        layoutColumn: 2,
        layoutRow: 1,
        unlockMode: 'all',
        difficulty: 1,
      },
    ])
    .onConflictDoNothing()

  await db
    .insert(skillEdges)
    .values({
      skillMapId: ids.skillMapId,
      fromNodeId: ids.htmlNodeId,
      toNodeId: ids.cssNodeId,
      kind: 'path',
    })
    .onConflictDoNothing()

  await db
    .insert(skillNodeUnlockNodes)
    .values({
      skillNodeId: ids.cssNodeId,
      requiredNodeId: ids.htmlNodeId,
    })
    .onConflictDoNothing()

  await db
    .insert(users)
    .values({
      id: ids.userId,
      name: 'Demo User',
    })
    .onConflictDoNothing()

  await db
    .insert(userSkillNodeProgress)
    .values({
      userId: ids.userId,
      skillMapId: ids.skillMapId,
      skillNodeId: ids.htmlNodeId,
      completedAt: new Date(),
    })
    .onConflictDoNothing()
}

main()
  .then(() => {
    console.log('Database seed completed.')
  })
  .catch((error) => {
    console.error('Failed to seed database.')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
