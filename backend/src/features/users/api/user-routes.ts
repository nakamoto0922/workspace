import { Hono } from 'hono'
import {
  createUserRequestSchema,
  userProgressQuerySchema,
} from '@workspace/contracts'
import { parseWithSchema, readJsonBody } from '../../../app/api-error.js'
import {
  findUserProgressSummary,
  findUserSkillMapBundle,
  listAvailableUsers,
  registerUser,
} from '../service/user-service.js'

export const userRoutes = new Hono()

userRoutes.get('/', async (c) => {
  const users = await listAvailableUsers()
  return c.json(users)
})

userRoutes.post('/', async (c) => {
  const body = await readJsonBody(c, createUserRequestSchema)
  const user = await registerUser(body)

  return c.json(user, 201)
})

userRoutes.get('/:userId/progress', async (c) => {
  const query = parseWithSchema(userProgressQuerySchema, {
    skillMapId: c.req.query('skillMapId'),
  })

  const progress = await findUserProgressSummary({
    userId: c.req.param('userId'),
    skillMapId: query.skillMapId,
  })

  return c.json(progress)
})

userRoutes.get('/:userId/skill-maps/:skillMapId', async (c) => {
  const response = await findUserSkillMapBundle({
    userId: c.req.param('userId'),
    skillMapId: c.req.param('skillMapId'),
  })

  return c.json(response)
})
