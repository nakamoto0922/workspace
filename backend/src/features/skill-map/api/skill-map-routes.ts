import { Hono } from 'hono'
import {
  createSkillEdgeRequestSchema,
  createSkillMapRequestSchema,
  createSkillNodeRequestSchema,
  resolvedSkillMapQuerySchema,
  updateSkillMapRequestSchema,
} from '@workspace/contracts'
import { parseWithSchema, readJsonBody } from '../../../app/api-error.js'
import {
  addSkillEdge,
  addSkillNode,
  createNewSkillMap,
  findSkillMap,
  listAvailableSkillMaps,
  resolveStoredSkillMap,
  updateExistingSkillMap,
  validateStoredSkillMap,
} from '../service/skill-map-service.js'

export const skillMapRoutes = new Hono()

skillMapRoutes.get('/', async (c) => {
  const skillMaps = await listAvailableSkillMaps()
  return c.json(skillMaps)
})

skillMapRoutes.post('/', async (c) => {
  const body = await readJsonBody(c, createSkillMapRequestSchema)
  const skillMap = await createNewSkillMap(body)

  return c.json(skillMap, 201)
})

skillMapRoutes.get('/:skillMapId/resolved', async (c) => {
  const query = parseWithSchema(resolvedSkillMapQuerySchema, {
    userId: c.req.query('userId'),
  })

  const resolvedSkillMap = await resolveStoredSkillMap(
    c.req.param('skillMapId'),
    query.userId,
  )

  return c.json(resolvedSkillMap)
})

skillMapRoutes.post('/:skillMapId/validate', async (c) => {
  const validation = await validateStoredSkillMap(c.req.param('skillMapId'))
  return c.json(validation)
})

skillMapRoutes.post('/:skillMapId/nodes', async (c) => {
  const body = await readJsonBody(c, createSkillNodeRequestSchema)
  const node = await addSkillNode(c.req.param('skillMapId'), body)

  return c.json(node, 201)
})

skillMapRoutes.post('/:skillMapId/edges', async (c) => {
  const body = await readJsonBody(c, createSkillEdgeRequestSchema)
  const edge = await addSkillEdge(c.req.param('skillMapId'), body)

  return c.json(edge, 201)
})

skillMapRoutes.patch('/:skillMapId', async (c) => {
  const body = await readJsonBody(c, updateSkillMapRequestSchema)
  const skillMap = await updateExistingSkillMap(c.req.param('skillMapId'), body)

  return c.json(skillMap)
})

skillMapRoutes.get('/:skillMapId', async (c) => {
  const skillMap = await findSkillMap(c.req.param('skillMapId'))

  if (!skillMap) {
    return c.json({ message: 'Skill map not found yet.' }, 404)
  }

  return c.json(skillMap)
})
