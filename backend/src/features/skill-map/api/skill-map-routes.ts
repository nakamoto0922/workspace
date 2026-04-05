import { Hono } from 'hono'
import { findSkillMap } from '../service/skill-map-service.js'

export const skillMapRoutes = new Hono()

skillMapRoutes.get('/:skillMapId', async (c) => {
  const skillMap = await findSkillMap(c.req.param('skillMapId'))

  if (!skillMap) {
    return c.json({ message: 'Skill map not found yet.' }, 404)
  }

  return c.json(skillMap)
})
