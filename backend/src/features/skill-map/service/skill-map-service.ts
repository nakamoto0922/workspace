import { NotFoundError } from '../../../app/api-error.js'
import { getCompletedNodeIds } from '../../progress/repository/progress-repository.js'
import {
  createSkillEdge,
  createSkillMap,
  createSkillNode,
  deleteSkillEdge,
  deleteSkillNode,
  getSkillMapById,
  listSkillMaps,
  updateSkillMap,
  updateSkillNode,
} from '../repository/skill-map-repository.js'
import { resolveSkillMap, validateSkillMap } from '../model/skill-map.js'

export async function listAvailableSkillMaps() {
  return listSkillMaps()
}

export async function findSkillMap(skillMapId: string) {
  return getSkillMapById(skillMapId)
}

export async function createNewSkillMap(input: {
  name: string
  version?: number
}) {
  return createSkillMap(input)
}

export async function updateExistingSkillMap(
  skillMapId: string,
  input: {
    name?: string
    version?: number
  },
) {
  return updateSkillMap(skillMapId, input)
}

export async function addSkillNode(
  skillMapId: string,
  input: {
    code: string
    title: string
    description: string
    kind: string
    layoutColumn: number
    layoutRow: number
    unlockMode?: 'all' | 'any'
    difficulty?: number | null
    memo?: string | null
    unlockNodeIds?: string[]
  },
) {
  return createSkillNode(skillMapId, input)
}

export async function updateExistingSkillNode(
  skillNodeId: string,
  input: {
    code?: string
    title?: string
    description?: string
    kind?: string
    layoutColumn?: number
    layoutRow?: number
    unlockMode?: 'all' | 'any'
    difficulty?: number | null
    memo?: string | null
    unlockNodeIds?: string[]
  },
) {
  return updateSkillNode(skillNodeId, input)
}

export async function removeSkillNode(skillNodeId: string) {
  return deleteSkillNode(skillNodeId)
}

export async function addSkillEdge(
  skillMapId: string,
  input: {
    fromNodeId: string
    toNodeId: string
    kind?: string
  },
) {
  return createSkillEdge(skillMapId, input)
}

export async function removeSkillEdge(skillEdgeId: string) {
  return deleteSkillEdge(skillEdgeId)
}

export async function validateStoredSkillMap(skillMapId: string) {
  const skillMap = await getSkillMapById(skillMapId)

  if (!skillMap) {
    throw new NotFoundError('Skill map not found.')
  }

  return validateSkillMap(skillMap)
}

export async function resolveStoredSkillMap(skillMapId: string, userId: string) {
  const skillMap = await getSkillMapById(skillMapId)

  if (!skillMap) {
    throw new NotFoundError('Skill map not found.')
  }

  const completedNodeIds = await getCompletedNodeIds(userId, skillMapId)
  return resolveSkillMap(skillMap, completedNodeIds)
}
