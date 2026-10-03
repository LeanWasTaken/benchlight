// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('foundation CSS', () => {
  it('declares each type voice once, shared by component parts', () => {
    const css = read('css/type.css')
    for (const selector of [
      '.kd-display,',
      '.kd-index-row__title',
      '.kd-display--xl',
      '.kd-display--lg',
      '.kd-display--md,',
      '.kd-annotation,',
      '.kd-link-arrow {',
      '.kd-silkscreen,',
      '.kd-field__label {',
      '.kd-lede {'
    ]) {
      expect(css).toContain(selector)
    }
    expect(css).toContain('font-stretch: 80%;')
    expect(css).toContain('font-variant-numeric: tabular-nums;')
  })

  it('switches motion off for reduced-motion users', () => {
    expect(read('css/base.css')).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('staggers the rise entrance through --kd-rise-delay', () => {
    expect(read('css/motion.css')).toContain('animation-delay: var(--kd-rise-delay, 0ms);')
  })

  it('narrows the gutter at 480px', () => {
    expect(read('css/layout.css')).toContain('padding-inline: var(--kd-layout-gutter-narrow);')
  })

  it('hides kd-sr-only content without margin, padding or border', () => {
    expect(read('css/layout.css')).toMatch(
      /\.kd-sr-only\s*\{[^}]*margin: -1px;[^}]*padding: 0;[^}]*border: 0;/
    )
  })

  it('offers a 10% tint per accent', () => {
    const css = read('css/tints.css')
    for (const accent of ['trace', 'copper', 'phosphor', 'danger']) {
      expect(css).toContain(`.kd-tint-${accent} {`)
    }
  })
})
