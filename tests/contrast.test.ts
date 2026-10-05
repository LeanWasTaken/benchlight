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

  // A selected .bl-index-row sits on a 10% trace tint; its secondary text must stay readable.
  it.each(THEMES.flatMap((theme) => TINT_GROUNDS.map((bg) => [theme, bg] as const)))(
    '%s ink-2 on a selected row tint over %s',
    (theme, bg) => {
      const c = tokens.color[theme]
      const ground = mix(hexToRgb(c.trace), hexToRgb(c[bg]), 0.1)
      expect(contrast(hexToRgb(c['ink-2']), ground)).toBeGreaterThanOrEqual(4.5)
    }
  )

  // An actionable BlTable row sits on a 6% trace tint; its trace link text must stay readable.
  it.each(THEMES.flatMap((theme) => TINT_GROUNDS.map((bg) => [theme, bg] as const)))(
    '%s trace on an actionable row tint over %s',
    (theme, bg) => {
      const c = tokens.color[theme]
      const ground = mix(hexToRgb(c.trace), hexToRgb(c[bg]), 0.06)
      expect(contrast(hexToRgb(c.trace), ground)).toBeGreaterThanOrEqual(4.5)
    }
  )

  it('shows why ink-3 is not allowed on a selected row tint', () => {
    const c = tokens.color.light
    const ground = mix(hexToRgb(c.trace), hexToRgb(c.canvas), 0.1)
    expect(contrast(hexToRgb(c['ink-3']), ground)).toBeLessThan(4.5)
  })

  it('shows why copper and phosphor text is not allowed on tints (spec §4.1)', () => {
    const c = tokens.color.light
    for (const accent of ['copper', 'phosphor'] as const) {
      const text = hexToRgb(c[accent])
      expect(contrast(text, mix(text, hexToRgb(c.canvas), 0.1))).toBeLessThan(4.5)
    }
  })
})

describe('non-text contrast for control edges (WCAG 1.4.11)', () => {
  const pairs = THEMES.flatMap((theme) => SURFACES.map((bg) => [theme, bg] as const))
  it.each(pairs)('%s control-border on %s', (theme, bg) => {
    const c = tokens.color[theme]
    expect(contrast(hexToRgb(c['control-border']), hexToRgb(c[bg]))).toBeGreaterThanOrEqual(3)
  })
})
