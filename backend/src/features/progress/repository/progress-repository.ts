export async function completeSkillNode(input: {
  userId: string
  skillMapId: string
  skillNodeId: string
}) {
  return {
    ...input,
    completed: true,
  }
}
