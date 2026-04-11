import { Hono } from 'hono'
import { progressMutationRequestSchema } from '@workspace/contracts'
import { readJsonBody } from '../../../app/api-error.js'
import {
  markSkillNodeComplete,
  unmarkSkillNodeComplete,
} from '../service/progress-service.js'

export const progressRoutes = new Hono()

progressRoutes.post('/:skillNodeId/complete', async (c) => {
  const body = await readJsonBody(c, progressMutationRequestSchema)

  const result = await markSkillNodeComplete({
    userId: body.userId,
    skillMapId: body.skillMapId,
    skillNodeId: c.req.param('skillNodeId'),
  })

  return c.json(result, 201)
})

progressRoutes.delete('/:skillNodeId/complete', async (c) => {
  const body = await readJsonBody(c, progressMutationRequestSchema)

  const result = await unmarkSkillNodeComplete({
    userId: body.userId,
    skillMapId: body.skillMapId,
    skillNodeId: c.req.param('skillNodeId'),
  })

  return c.json(result)
})
