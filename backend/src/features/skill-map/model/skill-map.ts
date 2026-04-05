export type SkillMapNodeKind = 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5'
export type SkillMapUnlockMode = 'all' | 'any'

export type SkillMapNode = {
  id: string
  code: string
  title: string
  description: string
  kind: SkillMapNodeKind
  layout: {
    column: number
    row: number
  }
  unlock: {
    mode: SkillMapUnlockMode
    nodeIds: string[]
  }
}

export type SkillMapEdge = {
  id: string
  fromNodeId: string
  toNodeId: string
  kind: 'path'
}

export type SkillMapDetail = {
  id: string
  name: string
  version: number
  nodes: SkillMapNode[]
  edges: SkillMapEdge[]
}
