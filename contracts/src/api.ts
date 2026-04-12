import { z } from 'zod'

export const nonEmptyStringSchema = z.string().trim().min(1, {
  message: 'must be a non-empty string.',
})

export const isoDateTimeStringSchema = z.string()

export const idSchema = nonEmptyStringSchema

export const apiErrorResponseSchema = z.object({
  message: nonEmptyStringSchema,
})
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
})
export type HealthResponse = z.infer<typeof healthResponseSchema>

export const databaseHealthResponseSchema = z.object({
  status: z.literal('ok'),
  database: z.literal('ok'),
})
export type DatabaseHealthResponse = z.infer<typeof databaseHealthResponseSchema>

export const createUserRequestSchema = z.object({
  name: nonEmptyStringSchema,
})
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>

export const userSummarySchema = z.object({
  id: idSchema,
  name: nonEmptyStringSchema,
  createdAt: isoDateTimeStringSchema,
})
export type UserSummary = z.infer<typeof userSummarySchema>

export const userSummaryListSchema = z.array(userSummarySchema)
export type UserSummaryList = z.infer<typeof userSummaryListSchema>

export const userProgressQuerySchema = z.object({
  skillMapId: nonEmptyStringSchema.optional(),
})
export type UserProgressQuery = z.infer<typeof userProgressQuerySchema>

export const progressMutationRequestSchema = z.object({
  userId: idSchema,
  skillMapId: idSchema,
})
export type ProgressMutationRequest = z.infer<typeof progressMutationRequestSchema>

export const progressMutationResponseSchema = z.object({
  userId: idSchema,
  skillMapId: idSchema,
  skillNodeId: idSchema,
  completed: z.boolean(),
  completedAt: isoDateTimeStringSchema,
})
export type ProgressMutationResponse = z.infer<typeof progressMutationResponseSchema>

export const progressRemovalResponseSchema = z.object({
  userId: idSchema,
  skillMapId: idSchema,
  skillNodeId: idSchema,
  completed: z.literal(false),
  removed: z.boolean(),
})
export type ProgressRemovalResponse = z.infer<typeof progressRemovalResponseSchema>

export const skillMapUnlockModeSchema = z.enum(['all', 'any'])
export type SkillMapUnlockMode = z.infer<typeof skillMapUnlockModeSchema>

export const skillMapNodeStatusSchema = z.enum(['locked', 'available', 'completed'])
export type SkillMapNodeStatus = z.infer<typeof skillMapNodeStatusSchema>

export const skillMapNodeSchema = z.object({
  id: idSchema,
  code: nonEmptyStringSchema,
  title: nonEmptyStringSchema,
  description: z.string(),
  kind: nonEmptyStringSchema,
  layout: z.object({
    column: z.number().int(),
    row: z.number().int(),
  }),
  unlock: z.object({
    mode: skillMapUnlockModeSchema,
    nodeIds: z.array(idSchema),
  }),
  difficulty: z.number().int().optional(),
  memo: z.string().optional(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
})
export type SkillMapNode = z.infer<typeof skillMapNodeSchema>

export const skillMapEdgeSchema = z.object({
  id: idSchema,
  fromNodeId: idSchema,
  toNodeId: idSchema,
  kind: nonEmptyStringSchema,
})
export type SkillMapEdge = z.infer<typeof skillMapEdgeSchema>

export const skillMapSummarySchema = z.object({
  id: idSchema,
  name: nonEmptyStringSchema,
  version: z.number().int(),
  nodeCount: z.number().int(),
  edgeCount: z.number().int(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
})
export type SkillMapSummary = z.infer<typeof skillMapSummarySchema>

export const skillMapSummaryListSchema = z.array(skillMapSummarySchema)
export type SkillMapSummaryList = z.infer<typeof skillMapSummaryListSchema>

export const skillMapDetailSchema = z.object({
  id: idSchema,
  name: nonEmptyStringSchema,
  version: z.number().int(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
  nodes: z.array(skillMapNodeSchema),
  edges: z.array(skillMapEdgeSchema),
})
export type SkillMapDetail = z.infer<typeof skillMapDetailSchema>

export const resolvedSkillMapNodeSchema = skillMapNodeSchema.extend({
  status: skillMapNodeStatusSchema,
  incomingEdgeIds: z.array(idSchema),
  outgoingEdgeIds: z.array(idSchema),
})
export type ResolvedSkillMapNode = z.infer<typeof resolvedSkillMapNodeSchema>

export const resolvedSkillMapDetailSchema = skillMapDetailSchema.extend({
  completedNodeIds: z.array(idSchema),
  nodes: z.array(resolvedSkillMapNodeSchema),
})
export type ResolvedSkillMapDetail = z.infer<typeof resolvedSkillMapDetailSchema>

export const resolvedSkillMapQuerySchema = z.object({
  userId: idSchema,
})
export type ResolvedSkillMapQuery = z.infer<typeof resolvedSkillMapQuerySchema>

export const skillMapIssueCodeSchema = z.enum([
  'DUPLICATE_NODE_ID',
  'DUPLICATE_EDGE_ID',
  'MISSING_EDGE_SOURCE',
  'MISSING_EDGE_TARGET',
  'MISSING_UNLOCK_NODE',
  'SELF_UNLOCK',
  'SELF_EDGE',
  'UNLOCK_CYCLE',
])
export type SkillMapIssueCode = z.infer<typeof skillMapIssueCodeSchema>

export const skillMapIssueSchema = z.object({
  code: skillMapIssueCodeSchema,
  nodeId: idSchema.optional(),
  edgeId: idSchema.optional(),
  message: nonEmptyStringSchema,
})
export type SkillMapIssue = z.infer<typeof skillMapIssueSchema>

export const skillMapValidationSchema = z.object({
  isValid: z.boolean(),
  issues: z.array(skillMapIssueSchema),
})
export type SkillMapValidation = z.infer<typeof skillMapValidationSchema>

const optionalIntegerSchema = z.number().int({
  message: 'must be an integer.',
}).optional()

const optionalNullableIntegerSchema = z.number().int({
  message: 'must be an integer.',
}).nullable().optional()

const optionalNullableStringSchema = z.string().nullable().optional()

const optionalUniqueStringArraySchema = z
  .array(z.string())
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined
    }

    return [...new Set(value)]
  })

export const createSkillMapRequestSchema = z.object({
  name: nonEmptyStringSchema,
  version: optionalIntegerSchema,
})
export type CreateSkillMapRequest = z.infer<typeof createSkillMapRequestSchema>

export const updateSkillMapRequestSchema = z.object({
  name: z.string().optional(),
  version: optionalIntegerSchema,
})
export type UpdateSkillMapRequest = z.infer<typeof updateSkillMapRequestSchema>

export const createSkillNodeRequestSchema = z.object({
  code: nonEmptyStringSchema,
  title: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  kind: nonEmptyStringSchema,
  layoutColumn: z.number().int({
    message: 'must be an integer.',
  }),
  layoutRow: z.number().int({
    message: 'must be an integer.',
  }),
  unlockMode: skillMapUnlockModeSchema.optional(),
  difficulty: optionalNullableIntegerSchema,
  memo: optionalNullableStringSchema,
  unlockNodeIds: optionalUniqueStringArraySchema,
})
export type CreateSkillNodeRequest = z.infer<typeof createSkillNodeRequestSchema>

export const updateSkillNodeRequestSchema = z.object({
  code: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  kind: z.string().optional(),
  layoutColumn: optionalIntegerSchema,
  layoutRow: optionalIntegerSchema,
  unlockMode: skillMapUnlockModeSchema.optional(),
  difficulty: optionalNullableIntegerSchema,
  memo: optionalNullableStringSchema,
  unlockNodeIds: optionalUniqueStringArraySchema,
})
export type UpdateSkillNodeRequest = z.infer<typeof updateSkillNodeRequestSchema>

export const createSkillEdgeRequestSchema = z.object({
  fromNodeId: idSchema,
  toNodeId: idSchema,
  kind: z.string().optional(),
})
export type CreateSkillEdgeRequest = z.infer<typeof createSkillEdgeRequestSchema>

export const skillNodeDeleteResponseSchema = z.object({
  id: idSchema,
  skillMapId: idSchema,
  deleted: z.literal(true),
})
export type SkillNodeDeleteResponse = z.infer<typeof skillNodeDeleteResponseSchema>

export const skillEdgeDeleteResponseSchema = z.object({
  id: idSchema,
  skillMapId: idSchema,
  deleted: z.literal(true),
})
export type SkillEdgeDeleteResponse = z.infer<typeof skillEdgeDeleteResponseSchema>

export const userProgressItemSchema = z.object({
  skillMapId: idSchema,
  skillNodeId: idSchema,
  completedAt: isoDateTimeStringSchema.nullable(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
})
export type UserProgressItem = z.infer<typeof userProgressItemSchema>

export const userProgressSummarySchema = z.object({
  userId: idSchema,
  skillMapId: idSchema.nullable(),
  completedNodeIds: z.array(idSchema),
  totalCompleted: z.number().int(),
  items: z.array(userProgressItemSchema),
})
export type UserProgressSummary = z.infer<typeof userProgressSummarySchema>

export const userSkillMapBundleSchema = z.object({
  user: userSummarySchema,
  skillMap: skillMapDetailSchema,
  progress: userProgressSummarySchema,
})
export type UserSkillMapBundle = z.infer<typeof userSkillMapBundleSchema>
