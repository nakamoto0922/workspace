import { NotFoundError } from '../../../app/api-error.js'
import { findUserProgress } from '../../progress/service/progress-service.js'
import { findSkillMap } from '../../skill-map/service/skill-map-service.js'
import { createUser, getUserById, listUsers } from '../repository/user-repository.js'

export async function listAvailableUsers() {
  return listUsers()
}

export async function registerUser(input: { name: string }) {
  return createUser(input)
}

export async function findUserProgressSummary(input: {
  userId: string
  skillMapId?: string
}) {
  return findUserProgress(input)
}

export async function findUserSkillMapBundle(input: {
  userId: string
  skillMapId: string
}) {
  const [user, skillMap, progress] = await Promise.all([
    getUserById(input.userId),
    findSkillMap(input.skillMapId),
    findUserProgress({
      userId: input.userId,
      skillMapId: input.skillMapId,
    }),
  ])

  if (!user) {
    throw new NotFoundError('User not found.')
  }

  if (!skillMap) {
    throw new NotFoundError('Skill map not found.')
  }

  return {
    user,
    skillMap,
    progress,
  }
}
