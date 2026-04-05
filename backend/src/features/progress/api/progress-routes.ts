import { Hono } from 'hono'
import { markSkillNodeComplete } from '../service/progress-service.js'

export const progressRoutes = new Hono()

progressRoutes.post('/:skillNodeId/complete', async (c) => {
  const body = await c.req.json<{
    userId: string
    skillMapId: string
  }>()

  const result = await markSkillNodeComplete({
    userId: body.userId,
    skillMapId: body.skillMapId,
    skillNodeId: c.req.param('skillNodeId'),
  })

  return c.json(result, 201)
})
