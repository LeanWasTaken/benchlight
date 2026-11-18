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
    expect(rule).toContain('outline: 2px solid var(--bl-color-trace);')
    expect(rule).toContain('outline-offset: 2px;')
  })
})

describe('forced colors', () => {
  const files: Array<[string, string[]]> = [
    ['led', ['.bl-led', '.bl-led--on', '.bl-led--danger']],
    ['meter', ['.bl-meter', '.bl-meter__fill']],
    ['eq', ['.bl-eq__bar', '.bl-eq--active .bl-eq__bar']],
    ['msg', ['.bl-msg--success::before', '.bl-msg--danger::before']],
    ['segmented', [".bl-segmented__item[aria-current]:not([aria-current='false'])"]],
    [
      'field',
      [
        '.bl-field__error::before',
        ".bl-input[aria-invalid='true']:not(:disabled)",
        ".bl-select[aria-invalid='true']:not(:disabled)",
        ".bl-textarea[aria-invalid='true']:not(:disabled)"
      ]
    ],
    ['fieldset', ['.bl-fieldset__error::before', '.bl-fieldset--invalid']],
    [
      'toggle',
      [
        '.bl-toggle__track',
        '.bl-toggle__input:checked + .bl-toggle__track',
        '.bl-toggle__error::before',
        ".bl-toggle__input[aria-invalid='true']:not(:disabled) + .bl-toggle__track"
      ]
    ],
    [
      'checkbox',
      [
        '.bl-checkbox__box',
        '.bl-checkbox__box::after',
        '.bl-checkbox__input:checked + .bl-checkbox__box',
        '.bl-checkbox__input:indeterminate + .bl-checkbox__box',
        '.bl-checkbox__error::before',
        ".bl-checkbox__input[aria-invalid='true']:not(:disabled) + .bl-checkbox__box"
      ]
    ],
    [
      'radio',
      [
        '.bl-radio__dot',
        '.bl-radio__dot::after',
        '.bl-radio__input:checked + .bl-radio__dot',
        '.bl-radio__input:focus-visible + .bl-radio__dot',
        '.bl-radio__input:disabled + .bl-radio__dot'
      ]
    ],
    ['disclosure', ['.bl-disclosure__chevron']],
    ['toast', ['.bl-toast', '.bl-toast__mark', '.bl-toast--danger .bl-toast__mark']]
  ]
  it.each(files)('%s keeps its state visible', (name, selectors) => {
    const block = forced(read(`css/components/${name}.css`))
    for (const selector of selectors) expect(block).toContain(selector)
    expect(block).toContain('forced-color-adjust: none;')
  })
  it('lightbox buttons and message keep an edge in forced colors', () => {
    const block = forced(read('css/components/lightbox.css'))
    for (const sel of ['.bl-lightbox__close', '.bl-lightbox__nav', '.bl-lightbox__message'])
      expect(block).toContain(sel)
    expect(block).toContain('CanvasText')
  })
  it('dialog panel keeps an edge in forced colors', () => {
    const block = forced(read('css/components/dialog.css'))
    expect(block).toContain('.bl-dialog__panel')
    expect(block).toContain('CanvasText')
  })
})

describe('non-text contrast', () => {
  it('draws form controls and control edges with --bl-color-control-border', () => {
    expect(
      body(read('css/components/field.css'), '.bl-input,\n  .bl-select,\n  .bl-textarea')
    ).toContain('border: 1px solid var(--bl-color-control-border);')
    expect(body(read('css/components/btn.css'), '.bl-btn--secondary')).toContain(
      'border-color: var(--bl-color-control-border);'
    )
    expect(body(read('css/components/meter.css'), '.bl-meter')).toContain(
      'var(--bl-color-control-border)'
    )
    expect(body(read('css/components/appearance.css'), '.bl-appearance__track::before')).toContain(
      'border: 1px solid var(--bl-color-control-border);'
    )
    expect(
      body(
        read('css/components/segmented.css'),
        ".bl-segmented__item[aria-current]:not([aria-current='false']),\n  .bl-segmented__item:has(:checked)"
      )
    ).toContain('var(--bl-color-control-border)')
  })
})

describe('.bl-prose under a CSS reset', () => {
  const css = read('css/components/prose.css')
  it('restores ordered lists', () => {
    const rule = body(css, '.bl-prose ol')
    expect(rule).toContain('padding-inline-start: 1.75em;')
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
      'outline: 2px solid var(--bl-color-trace);'
    )
  })
  it('survives minification', () => {
    expect(buildDist(new URL('..', import.meta.url).pathname).bundle).toMatch(
      /:focus-visible:focus-visible\{outline:2px solid var\(--bl-color-trace\)/
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

describe('current-page cue beyond colour', () => {
  const current =
    ":is(.bl-site-bar__link, .bl-tab-bar__item, .bl-index-row)[aria-current]:not([aria-current='false'])"
  it.each([
    [
      'site-bar',
      ".bl-site-bar__link[aria-current]:not([aria-current='false'])",
      'text-decoration: underline;'
    ],
    [
      'tab-bar',
      ".bl-tab-bar__item[aria-current]:not([aria-current='false'])",
      'box-shadow: inset 0 2px 0'
    ],
    [
      'index-row',
      ".bl-index-row[aria-current]:not([aria-current='false'])",
      'box-shadow: inset 2px 0 0'
    ]
  ])(
    '%s marks the current item with a non-colour cue and a forced-colors fallback',
    (name, selector, cue) => {
      const css = read(`css/components/${name}.css`)
      expect(current).toContain('aria-current')
      expect(body(css, selector)).toContain(cue)
      const fallback = forced(css)
      expect(fallback).toContain(selector)
      expect(fallback).toContain('Highlight')
    }
  )
})

describe('plain content fallbacks', () => {
  it.each(['field', 'toggle', 'checkbox', 'fieldset'])(
    '%s error mark declares plain content before the alt-text form',
    (name) => {
      const css = read(`css/components/${name}.css`)
      expect(css).toMatch(/content: '!';\s*content: '!' \/ '';/)
    }
  )
})

describe('logical properties for rtl', () => {
  it.each([
    'prose',
    'prev-next',
    'index-row',
    'section-head',
    'meta',
    'field',
    'site-bar',
    'skip-link',
    'appearance'
  ])('%s uses no physical left/right', (name) => {
    const css = read(`css/components/${name}.css`)
    expect(css).not.toMatch(/(margin|padding|border)-(left|right)\s*:/)
    expect(css).not.toMatch(/text-align:\s*(left|right)/)
    expect(css).not.toMatch(/^\s*(left|right):/m)
  })
  it('mirrors the appearance thumb under rtl, including before mount', () => {
    const css = read('css/components/appearance.css')
    expect(css).toContain('inset-inline-start: 2px;')
    expect(css.match(/:dir\(rtl\)[^{]*\{\s*transform: translateX\(-(44|88)px\)/g)).toHaveLength(4)
  })
  it('flips the marquee mask under rtl', () => {
    expect(read('css/components/marquee.css')).toMatch(/:dir\(rtl\)\s*\{[^}]*to left/)
  })
})

describe('robustness guards', () => {
  it('hides closed popover panels where :popover-open is unsupported', () => {
    expect(read('css/components/popover.css')).toMatch(
      /@supports not selector\(:popover-open\)\s*\{\s*:where\(\.bl-popover\)\s*\{\s*display: none/
    )
    expect(read('css/components/tooltip.css')).toMatch(
      /@supports not selector\(:popover-open\)\s*\{\s*:where\(\.bl-tooltip\)\s*\{\s*display: none/
    )
  })
  it('isolates the scroll table and the appearance track', () => {
    expect(body(read('css/components/table.css'), '.bl-table--scroll')).toContain(
      'isolation: isolate;'
    )
    expect(body(read('css/components/appearance.css'), '.bl-appearance__track')).toContain(
      'isolation: isolate;'
    )
  })
  it('scopes the table measuring reset to Benchlight parts, not host content', () => {
    const css = read('css/components/table.css')
    expect(css).not.toMatch(/\[data-measuring\] \*/)
    expect(css).toContain('[data-measuring]\n    :where(')
  })
  it('resets reduced-motion on the dialog backdrop', () => {
    expect(read('css/base.css')).toMatch(/\)::backdrop\s*\{\s*animation-duration: 0\.01ms/)
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
