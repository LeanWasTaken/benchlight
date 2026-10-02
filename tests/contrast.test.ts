import { describe, expect, it } from 'vitest'
import { tokens } from '../tokens/tokens'
import { contrast, hexToRgb, mix } from './helpers/color'

const THEMES = ['light', 'dark'] as const
const TEXT = ['ink-1', 'ink-2', 'ink-3', 'trace', 'copper', 'phosphor', 'danger'] as const
const SURFACES = ['canvas', 'surface', 'raised'] as const
const TINT_TEXT = ['trace', 'danger'] as const
const TINT_GROUNDS = ['canvas', 'surface'] as const

describe('contrast helper', () => {
  it('measures black on white as 21:1', () => {
    expect(contrast(hexToRgb('#000000'), hexToRgb('#ffffff'))).toBeCloseTo(21, 5)
  })
})

describe('WCAG AA for text tokens', () => {
  const pairs = THEMES.flatMap((theme) =>
    TEXT.flatMap((fg) => SURFACES.map((bg) => [theme, fg, bg] as const))
  )
  it.each(pairs)('%s %s on %s', (theme, fg, bg) => {
    const c = tokens.color[theme]
    expect(contrast(hexToRgb(c[fg]), hexToRgb(c[bg]))).toBeGreaterThanOrEqual(4.5)
  })

  const tintPairs = THEMES.flatMap((theme) =>
    TINT_TEXT.flatMap((fg) => TINT_GROUNDS.map((bg) => [theme, fg, bg] as const))
  )
  it.each(tintPairs)('%s %s text on its own 10%% tint over %s', (theme, fg, bg) => {
    const c = tokens.color[theme]
    const text = hexToRgb(c[fg])
    expect(contrast(text, mix(text, hexToRgb(c[bg]), 0.1))).toBeGreaterThanOrEqual(4.5)
  })

  it('shows why copper and phosphor text is not allowed on tints (spec §4.1)', () => {
    const c = tokens.color.light
    for (const accent of ['copper', 'phosphor'] as const) {
      const text = hexToRgb(c[accent])
      expect(contrast(text, mix(text, hexToRgb(c.canvas), 0.1))).toBeLessThan(4.5)
    }
  })
})
