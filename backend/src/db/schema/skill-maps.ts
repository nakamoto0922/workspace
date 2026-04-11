import {
  integer,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const skillMaps = pgTable(
  'skill_maps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('skill_maps_name_version_unique').on(table.name, table.version)],
)

export const skillNodes = pgTable(
  'skill_nodes',
  {
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
  },
  (table) => [
    unique('skill_nodes_skill_map_id_code_unique').on(table.skillMapId, table.code),
    index('skill_nodes_skill_map_id_idx').on(table.skillMapId),
    index('skill_nodes_code_idx').on(table.code),
  ],
)

export const skillEdges = pgTable(
  'skill_edges',
  {
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
  },
  (table) => [
    unique('skill_edges_unique').on(
      table.skillMapId,
      table.fromNodeId,
      table.toNodeId,
      table.kind,
    ),
    index('skill_edges_skill_map_id_idx').on(table.skillMapId),
    index('skill_edges_from_node_id_idx').on(table.fromNodeId),
    index('skill_edges_to_node_id_idx').on(table.toNodeId),
  ],
)

export const skillNodeUnlockNodes = pgTable(
  'skill_node_unlock_nodes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    skillNodeId: uuid('skill_node_id')
      .notNull()
      .references(() => skillNodes.id, { onDelete: 'cascade' }),
    requiredNodeId: uuid('required_node_id')
      .notNull()
      .references(() => skillNodes.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('skill_node_unlock_nodes_unique').on(
      table.skillNodeId,
      table.requiredNodeId,
    ),
    index('skill_node_unlock_nodes_skill_node_id_idx').on(table.skillNodeId),
    index('skill_node_unlock_nodes_required_node_id_idx').on(table.requiredNodeId),
  ],
)
