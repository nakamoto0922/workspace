import { completeSkillNode } from '../repository/progress-repository.js'

export async function markSkillNodeComplete(input: {
  userId: string
  skillMapId: string
  skillNodeId: string
}) {
  return completeSkillNode(input)
}
