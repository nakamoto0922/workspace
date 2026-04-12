import { Hono } from 'hono'
import { removeSkillEdge } from '../service/skill-map-service.js'

export const skillEdgeRoutes = new Hono()

skillEdgeRoutes.delete('/:skillEdgeId', async (c) => {
  const result = await removeSkillEdge(c.req.param('skillEdgeId'))
  return c.json(result)
})
