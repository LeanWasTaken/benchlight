// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ruleBody } from './helpers/css'

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
    const body = ruleBody(read('css/base.css'), ":where([class^='bl-'], [class*=' bl-'])", [
      '@media (prefers-reduced-motion: reduce)'
    ])
    expect(body['animation-duration']).toBe('0.01ms !important')
    expect(body['animation-iteration-count']).toBe('1 !important')
    expect(body['transition-duration']).toBe('0.01ms !important')
    expect(body['scroll-behavior']).toBe('auto !important')
  })

  it('staggers the rise entrance through --bl-rise-delay', () => {
    expect(read('css/motion.css')).toContain('animation-delay: var(--bl-rise-delay, 0ms);')
  })

  it('narrows the gutter at 480px', () => {
    expect(read('css/layout.css')).toContain(
      'padding-inline: max(var(--bl-layout-gutter-narrow), env(safe-area-inset-left))'
    )
  })

  it('hides bl-sr-only content without margin, padding or border', () => {
    const body = ruleBody(read('css/layout.css'), '.bl-sr-only')
    expect(body).toMatchObject({
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
      padding: '0',
      overflow: 'hidden',
      border: '0',
      'clip-path': 'inset(50%)'
    })
  })

  it('offers a 10% tint per accent', () => {
    const css = read('css/tints.css')
    for (const accent of ['trace', 'copper', 'phosphor', 'danger']) {
      expect(css).toContain(`.bl-tint-${accent} {`)
    }
  })

  it('keeps focused elements clear of fixed chrome', () => {
    expect(read('css/base.css')).toContain(
      'scroll-padding-block: var(--bl-scroll-offset-top, 72px) var(--bl-scroll-offset-bottom, 0px);'
    )
  })

  it('draws a doubled-specificity trace focus ring on keyboard focus', () => {
    const ring = ruleBody(read('css/base.css'), ':focus-visible:focus-visible')
    expect(ring['outline']).toBe('2px solid var(--bl-trace)')
    expect(ring['outline-offset']).toBe('2px')
  })

  it('does not restyle host elements on focus', () => {
    const css = read('css/base.css')
    expect(ruleBody(css, ':focus-visible:focus-visible')['border-radius']).toBeUndefined()
    expect(css).not.toContain("[tabindex='-1']")
  })

  it('keeps the reduced-motion reset off the host app', () => {
    const css = read('css/base.css')
    const reduced = css.slice(css.indexOf('prefers-reduced-motion'))
    expect(reduced).not.toMatch(/^\s*\*/m)
    for (const pseudo of ['::before', '::after']) {
      expect(reduced).toContain(`:where([class^='bl-'], [class*=' bl-'])${pseudo}`)
    }
  })
})
