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

  // Pressed BlButton: primary is canvas text on a trace fill; secondary and ghost are trace text
  // and a trace border on a 10% trace tint over the surface.
  it.each(THEMES)('%s pressed primary button: canvas on trace is at least 4.5:1', (theme) => {
    const c = tokens.color[theme]
    expect(contrast(hexToRgb(c.canvas), hexToRgb(c.trace))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(THEMES.flatMap((theme) => SURFACES.map((bg) => [theme, bg] as const)))(
    '%s pressed primary button: trace fill edge against %s is at least 3:1',
    (theme, bg) => {
      const c = tokens.color[theme]
      expect(contrast(hexToRgb(c.trace), hexToRgb(c[bg]))).toBeGreaterThanOrEqual(3)
    }
  )

  it.each(THEMES)('%s pressed secondary/ghost button: trace on the tint and its edge', (theme) => {
    const c = tokens.color[theme]
    const trace = hexToRgb(c.trace)
    const ground = mix(trace, hexToRgb(c.surface), 0.1)
    expect(contrast(trace, ground)).toBeGreaterThanOrEqual(4.5)
    for (const bg of SURFACES) {
      expect(contrast(trace, hexToRgb(c[bg]))).toBeGreaterThanOrEqual(3)
    }
  })

  // Pressed danger is canvas text on a danger fill; pressed hover mixes the fill 12% toward ink-1,
  // which only raises the contrast of the canvas text.
  it.each(THEMES)('%s pressed danger button: canvas on danger, edge, and hover fill', (theme) => {
    const c = tokens.color[theme]
    const canvas = hexToRgb(c.canvas)
    const danger = hexToRgb(c.danger)
    expect(contrast(canvas, danger)).toBeGreaterThanOrEqual(4.5)
    for (const bg of SURFACES) {
      expect(contrast(danger, hexToRgb(c[bg]))).toBeGreaterThanOrEqual(3)
    }
    for (const fill of [c.trace, c.danger]) {
      const hover = mix(hexToRgb(fill), hexToRgb(c['ink-1']), 0.88)
      expect(contrast(canvas, hover)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each(THEMES)('%s pressed secondary/ghost hover: trace on a 16%% tint', (theme) => {
    const c = tokens.color[theme]
    const trace = hexToRgb(c.trace)
    expect(contrast(trace, mix(trace, hexToRgb(c.surface), 0.16))).toBeGreaterThanOrEqual(4.5)
  })

  // The inset ring is the non-colour cue: canvas inside the filled states, trace on the tint.
  it.each(THEMES)('%s pressed ring is at least 3:1 against its fill', (theme) => {
    const c = tokens.color[theme]
    for (const fill of [c.trace, c.danger]) {
      expect(contrast(hexToRgb(c.canvas), hexToRgb(fill))).toBeGreaterThanOrEqual(3)
    }
    const tint = mix(hexToRgb(c.trace), hexToRgb(c.surface), 0.1)
    expect(contrast(hexToRgb(c.trace), tint)).toBeGreaterThanOrEqual(3)
  })

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

describe('BlToggle', () => {
  it.each(THEMES)('%s: thumb (raised) on the checked track (trace) is at least 3:1', (theme) => {
    const c = tokens.color[theme]
    expect(contrast(hexToRgb(c.raised), hexToRgb(c.trace))).toBeGreaterThanOrEqual(3)
  })
  it.each(THEMES.flatMap((t) => SURFACES.map((s) => [t, s] as const)))(
    '%s: the checked track (trace) on %s is at least 3:1',
    (theme, bg) => {
      const c = tokens.color[theme]
      expect(contrast(hexToRgb(c.trace), hexToRgb(c[bg]))).toBeGreaterThanOrEqual(3)
    }
  )
  it.each(THEMES)('%s: the unchecked edge (control-border) on surface is at least 3:1', (theme) => {
    const c = tokens.color[theme]
    expect(contrast(hexToRgb(c['control-border']), hexToRgb(c.surface))).toBeGreaterThanOrEqual(3)
  })
})

describe('toast marks', () => {
  it.each(THEMES.flatMap((t) => (['phosphor', 'danger'] as const).map((m) => [t, m] as const)))(
    '%s %s mark on raised is at least 3:1',
    (theme, mark) => {
      const c = tokens.color[theme]
      expect(contrast(hexToRgb(c[mark]), hexToRgb(c.raised))).toBeGreaterThanOrEqual(3)
    }
  )
})
