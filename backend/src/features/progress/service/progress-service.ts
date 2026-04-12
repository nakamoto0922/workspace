import {
  completeSkillNode,
  ensureSkillMapIdQuery,
  getCompletedNodeIds,
  getUserProgress,
  uncompleteSkillNode,
} from '../repository/progress-repository.js'

export async function markSkillNodeComplete(input: {
  userId: string
  skillMapId: string
  skillNodeId: string
}) {
  return completeSkillNode(input)
}

export async function unmarkSkillNodeComplete(input: {
  userId: string
  skillMapId: string
  skillNodeId: string
}) {
  return uncompleteSkillNode(input)
}

export async function findUserProgress(input: {
  userId: string
  skillMapId?: string
}) {
  return getUserProgress(input.userId, input.skillMapId)
}

export async function findCompletedNodeIds(input: {
  userId: string
  skillMapId: string
}) {
  return getCompletedNodeIds(input.userId, input.skillMapId)
}

export { ensureSkillMapIdQuery }
