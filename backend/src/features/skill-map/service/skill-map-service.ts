import { getSkillMapById } from '../repository/skill-map-repository.js'

export async function findSkillMap(skillMapId: string) {
  return getSkillMapById(skillMapId)
}
