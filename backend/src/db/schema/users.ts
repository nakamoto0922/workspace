import { index, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import { skillMaps, skillNodes } from './skill-maps.js'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert

export const userSkillNodeProgress = pgTable(
  'user_skill_node_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillMapId: uuid('skill_map_id')
      .notNull()
      .references(() => skillMaps.id, { onDelete: 'cascade' }),
    skillNodeId: uuid('skill_node_id')
      .notNull()
      .references(() => skillNodes.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('user_skill_node_progress_unique').on(
      table.userId,
      table.skillMapId,
      table.skillNodeId,
    ),
    index('user_skill_node_progress_user_id_idx').on(table.userId),
    index('user_skill_node_progress_skill_map_id_idx').on(table.skillMapId),
    index('user_skill_node_progress_skill_node_id_idx').on(table.skillNodeId),
  ],
)
export type UserSkillNodeProgressRow = typeof userSkillNodeProgress.$inferSelect
export type NewUserSkillNodeProgressRow = typeof userSkillNodeProgress.$inferInsert
