// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('foundation CSS', () => {
  it('declares each type voice once, shared by component parts', () => {
    const css = read('css/type.css')
    for (const selector of [
      '.bl-display,',
      '.bl-index-row__title',
      '.bl-display--xl',
      '.bl-display--lg',
      '.bl-display--md,',
      '.bl-annotation,',
      '.bl-link-arrow {',
      '.bl-silkscreen,',
      '.bl-field__label {',
      '.bl-lede {'
    ]) {
      expect(css).toContain(selector)
    }
    expect(css).toContain('font-stretch: 80%;')
    expect(css).toContain('font-variant-numeric: tabular-nums;')
  })

  it('switches motion off for reduced-motion users', () => {
    expect(read('css/base.css')).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('staggers the rise entrance through --bl-rise-delay', () => {
    expect(read('css/motion.css')).toContain('animation-delay: var(--bl-rise-delay, 0ms);')
  })

  it('narrows the gutter at 480px', () => {
    expect(read('css/layout.css')).toContain('padding-inline: var(--bl-layout-gutter-narrow);')
  })

  it('hides bl-sr-only content without margin, padding or border', () => {
    expect(read('css/layout.css')).toMatch(
      /\.bl-sr-only\s*\{[^}]*margin: -1px;[^}]*padding: 0;[^}]*border: 0;/
    )
  })

  it('offers a 10% tint per accent', () => {
    const css = read('css/tints.css')
    for (const accent of ['trace', 'copper', 'phosphor', 'danger']) {
      expect(css).toContain(`.bl-tint-${accent} {`)
    }
  })
})
