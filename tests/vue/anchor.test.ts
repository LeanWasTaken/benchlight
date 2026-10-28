import { describe, expect, it } from 'vitest'
import { anchorName, panelAnchorStyle, triggerAnchorStyle } from '../../vue/internal/anchor'

describe('anchor helpers', () => {
  it('builds a dashed-ident from an id', () => {
    expect(anchorName('v-0')).toBe('--bl-v-0')
  })

  it('replaces characters that are invalid in a dashed-ident', () => {
    const name = anchorName(':r1:')
    expect(name).not.toContain(':')
    expect(name).toMatch(/^--bl-[A-Za-z0-9_-]+$/)
  })

  it('pairs trigger and panel by id', () => {
    expect(triggerAnchorStyle('a').anchorName).toBe(panelAnchorStyle('a').positionAnchor)
    expect(triggerAnchorStyle('a').anchorName).not.toBe(triggerAnchorStyle('b').anchorName)
  })
})
