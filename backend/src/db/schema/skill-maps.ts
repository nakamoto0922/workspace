import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const skillMaps = pgTable('skill_maps', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const skillNodes = pgTable('skill_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  skillMapId: uuid('skill_map_id')
    .notNull()
    .references(() => skillMaps.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 120 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  kind: varchar('kind', { length: 32 }).notNull(),
  layoutColumn: integer('layout_column').notNull(),
  layoutRow: integer('layout_row').notNull(),
  unlockMode: varchar('unlock_mode', { length: 16 }).notNull().default('all'),
  difficulty: integer('difficulty'),
  memo: text('memo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const skillEdges = pgTable('skill_edges', {
  id: uuid('id').defaultRandom().primaryKey(),
  skillMapId: uuid('skill_map_id')
    .notNull()
    .references(() => skillMaps.id, { onDelete: 'cascade' }),
  fromNodeId: uuid('from_node_id')
    .notNull()
    .references(() => skillNodes.id, { onDelete: 'cascade' }),
  toNodeId: uuid('to_node_id')
    .notNull()
    .references(() => skillNodes.id, { onDelete: 'cascade' }),
  kind: varchar('kind', { length: 32 }).notNull().default('path'),
})

export const skillNodeUnlockNodes = pgTable('skill_node_unlock_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  skillNodeId: uuid('skill_node_id')
    .notNull()
    .references(() => skillNodes.id, { onDelete: 'cascade' }),
  requiredNodeId: uuid('required_node_id')
    .notNull()
    .references(() => skillNodes.id, { onDelete: 'cascade' }),
})
