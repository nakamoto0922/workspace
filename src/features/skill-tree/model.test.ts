import { describe, expect, it } from 'vitest'
import {
  createSkillMap,
  getAvailableNodeIds,
  getNodesInLayoutOrder,
  resolveSkillMap,
  sampleSkillMap,
  validateSkillMap,
} from './model'

describe('skill map model', () => {
  it('supports parallel minor nodes between major nodes', () => {
    expect(
      getAvailableNodeIds(sampleSkillMap, {
        completedNodeIds: [],
      }),
    ).toEqual(['start-web'])

    expect(
      getAvailableNodeIds(sampleSkillMap, {
        completedNodeIds: ['start-web'],
      }),
    ).toEqual(['minor-html', 'minor-css', 'minor-js'])
  })

  it('unlocks next major node when any bridge node is completed', () => {
    const resolved = resolveSkillMap(sampleSkillMap, {
      completedNodeIds: ['start-web', 'minor-css'],
    })

    expect(resolved['major-react']?.status).toBe('available')
    expect(resolved['minor-html']?.status).toBe('available')
    expect(resolved['minor-js']?.status).toBe('available')
  })

  it('returns nodes in visual layout order', () => {
    expect(getNodesInLayoutOrder(sampleSkillMap).map((node) => node.id)).toEqual([
      'start-web',
      'minor-html',
      'minor-css',
      'minor-js',
      'major-react',
      'minor-props',
      'minor-state',
      'minor-fetch',
      'major-project',
    ])
  })

  it('detects unlock cycles', () => {
    const invalidMap = createSkillMap({
      nodes: [
        {
          id: 'a',
          title: 'A',
          description: '',
          kind: 'major',
          layout: { column: 0, row: 0 },
          unlock: { mode: 'all', nodeIds: ['b'] },
        },
        {
          id: 'b',
          title: 'B',
          description: '',
          kind: 'minor',
          layout: { column: 1, row: 0 },
          unlock: { mode: 'all', nodeIds: ['a'] },
        },
      ],
    })

    const validation = validateSkillMap(invalidMap)

    expect(validation.isValid).toBe(false)
    expect(validation.issues.map((issue) => issue.code)).toContain('UNLOCK_CYCLE')
  })
})
