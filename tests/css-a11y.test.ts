// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildDist } from '../scripts/lib/bundle'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The declaration block of the first rule whose selector list is exactly `selector`.
function body(css: string, selector: string): string {
  const match = css.match(new RegExp(`(?:^|[}\\s])${escape(selector)}\\s*\\{([^}]*)\\}`))
  if (!match) throw new Error(`no rule for ${selector}`)
  return match[1]!
}

const forced = (css: string) => {
  const start = css.indexOf('@media (forced-colors: active)')
  if (start < 0) throw new Error('no forced-colors block')
  return css.slice(start)
}

describe('keyboard focus on radio-mode segmented items', () => {
  const css = read('css/components/segmented.css')
  it('rings the label when its hidden radio takes focus', () => {
    const rule = body(css, '.bl-segmented__item:has(input:focus-visible)')
    expect(rule).toContain('outline: 2px solid var(--bl-trace);')
    expect(rule).toContain('outline-offset: 2px;')
  })
})

describe('forced colors', () => {
  const files: Array<[string, string[]]> = [
    ['led', ['.bl-led', '.bl-led--on', '.bl-led--danger']],
    ['meter', ['.bl-meter', '.bl-meter__fill']],
    ['eq', ['.bl-eq__bar', '.bl-eq--active .bl-eq__bar']],
    ['msg', ['.bl-msg--ok::before']],
    ['segmented', [".bl-segmented__item[aria-pressed='true']"]],
    ['toggle', ['.bl-toggle__track', '.bl-toggle__input:checked + .bl-toggle__track']]
  ]
  it.each(files)('%s keeps its state visible', (name, selectors) => {
    const block = forced(read(`css/components/${name}.css`))
    for (const selector of selectors) expect(block).toContain(selector)
    expect(block).toContain('forced-color-adjust: none;')
  })
})

describe('non-text contrast', () => {
  it('draws form controls and control edges with --bl-control-border', () => {
    expect(body(read('css/components/field.css'), '.bl-input,\n  .bl-select')).toContain(
      'border: 1px solid var(--bl-control-border);'
    )
    expect(body(read('css/components/btn.css'), '.bl-btn--secondary')).toContain(
      'border-color: var(--bl-control-border);'
    )
    expect(body(read('css/components/meter.css'), '.bl-meter')).toContain(
      'var(--bl-control-border)'
    )
    expect(body(read('css/components/switch.css'), '.bl-switch__track::before')).toContain(
      'border: 1px solid var(--bl-control-border);'
    )
    expect(
      body(
        read('css/components/segmented.css'),
        ".bl-segmented__item[aria-pressed='true'],\n  .bl-segmented__item[aria-current],\n  .bl-segmented__item:has(:checked)"
      )
    ).toContain('var(--bl-control-border)')
  })
})

describe('.bl-prose under a CSS reset', () => {
  const css = read('css/components/prose.css')
  it('restores ordered lists', () => {
    const rule = body(css, '.bl-prose ol')
    expect(rule).toContain('padding-left: 1.75em;')
    expect(rule).toContain('list-style: decimal;')
  })
  it('sizes and weights h4-h6 and strong explicitly', () => {
    expect(body(css, '.bl-prose h4')).toMatch(/font-size: [^;]+;[\s\S]*font-weight: 600;/)
    expect(body(css, '.bl-prose :is(h5, h6)')).toContain('font-weight: 600;')
    expect(body(css, '.bl-prose strong')).toContain('font-weight: 600;')
  })
})

describe('focus ring', () => {
  it('outranks a reset that styles :-moz-focusring at the same layer', () => {
    expect(body(read('css/base.css'), ':focus-visible:focus-visible')).toContain(
      'outline: 2px solid var(--bl-trace);'
    )
  })
  it('survives minification', () => {
    expect(buildDist(new URL('..', import.meta.url).pathname).bundle).toMatch(
      /:focus-visible:focus-visible\{outline:2px solid var\(--bl-trace\)/
    )
  })
})

describe('link hover keeps contrast', () => {
  it.each(['prose', 'spec-panel'])('%s links change their underline, not their opacity', (name) => {
    const css = read(`css/components/${name}.css`)
    const hover = css.match(/a:hover\s*\{([^}]*)\}/g) ?? []
    expect(hover.length).toBeGreaterThan(0)
    for (const rule of hover) expect(rule).not.toContain('opacity')
    expect(css).toContain('text-decoration-thickness: 2px;')
  })
})

describe('build', () => {
  it('targets the Firefox that supports :has()', () => {
    expect(read('scripts/lib/bundle.ts')).toContain('firefox: 121 << 16')
  })
  it('does not inject lightningcss colour-scheme helpers', () => {
    expect(buildDist(new URL('..', import.meta.url).pathname).bundle).not.toContain(
      '--lightningcss'
    )
  })
})
