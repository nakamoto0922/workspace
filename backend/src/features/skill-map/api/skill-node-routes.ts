import { Hono } from 'hono'
import { updateSkillNodeRequestSchema } from '@workspace/contracts'
import { readJsonBody } from '../../../app/api-error.js'
import { updateExistingSkillNode, removeSkillNode } from '../service/skill-map-service.js'

export const skillNodeRoutes = new Hono()

skillNodeRoutes.patch('/:skillNodeId', async (c) => {
  const body = await readJsonBody(c, updateSkillNodeRequestSchema)
  const node = await updateExistingSkillNode(c.req.param('skillNodeId'), body)

  return c.json(node)
})

skillNodeRoutes.delete('/:skillNodeId', async (c) => {
  const result = await removeSkillNode(c.req.param('skillNodeId'))
  return c.json(result)
})
