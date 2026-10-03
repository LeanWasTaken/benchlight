// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ruleBody } from './helpers/css'

const read = (name: string) =>
  readFileSync(new URL(`../css/components/${name}.css`, import.meta.url), 'utf8')

// Selectors each component must define; states are ARIA or native attributes.
const REQUIRED: Record<string, string[]> = {
  'site-bar': [
    '.bl-site-bar[data-lifted]',
    '.bl-site-bar__brand',
    ".bl-site-bar__link[aria-current='page']",
    '.bl-site-bar__navwrap + .bl-site-bar__actions'
  ],
  tabbar: [
    ".bl-tabbar__item[aria-current='page']",
    'body:has(.bl-tabbar)',
    'html:has(.bl-tabbar)',
    '--bl-scroll-offset-bottom: 96px'
  ],
  colophon: ['.bl-colophon__inner', '.bl-colophon__items a:hover'],
  'skip-link': ['.bl-skip-link:focus'],
  switch: [
    ".bl-switch__track:has(input[value='light']:checked)::before",
    ".bl-switch__track:has(input[value='dark']:checked)::before",
    '.bl-switch__track:has(input:focus-visible)',
    '.bl-switch__option:has(:checked)',
    '.bl-switch__option::before'
  ],
  segmented: [
    ".bl-segmented__item[aria-pressed='true']",
    '.bl-segmented__item[aria-current]',
    '.bl-segmented__item:has(:checked)',
    '.bl-segmented--compact .bl-segmented__item',
    '.bl-segmented__item::before'
  ],
  btn: [
    '.bl-btn--secondary',
    '.bl-btn--danger',
    '.bl-btn--pill',
    '.bl-btn:disabled',
    'pointer-events: none'
  ],
  field: ['.bl-input:focus-visible', '.bl-select', ".bl-range input[type='range']"],
  'link-arrow': ['.bl-link-arrow::before', '.bl-link-arrow--quiet'],
  'spec-panel': ['.bl-spec-row + .bl-spec-row', '.bl-spec-row__value a'],
  telemetry: [
    '.bl-ruler',
    'var(--bl-telemetry-columns, none)',
    '.bl-telemetry__cell + .bl-telemetry__cell'
  ],
  led: ['.bl-led--on', '.bl-led--danger'],
  eq: ['@keyframes bl-eq', '.bl-eq--active .bl-eq__bar'],
  marquee: ['@property --bl-mask-l', '.bl-marquee[data-overflowing]'],
  readout: ['.bl-readout__value'],
  meter: [
    'calc(var(--bl-meter-value, 0) * 100%)',
    '.bl-meter[data-indeterminate] .bl-meter__fill',
    '@keyframes bl-meter-slide',
    '@media (prefers-reduced-motion: reduce)'
  ],
  msg: ['.bl-msg--ok::before', '.bl-msg--err', '.bl-msg--info'],
  log: ['.bl-ansi-31', '.bl-ansi-97', 'var(--bl-log-height, 200px)'],
  'section-head': [
    '.bl-section-head--ruled',
    '.bl-section-head--bar',
    '.bl-section-head__action',
    '.bl-section-head:not(.bl-section-head--bar):has(> .bl-section-head__action)'
  ],
  meta: ['.bl-meta__sep', '.bl-meta__key'],
  'index-row': [
    '.bl-index--grid',
    ".bl-index-row[aria-current='true']",
    ".bl-index-row[aria-current='true'] .bl-meta",
    '.bl-index-row--compact .bl-index-row__title',
    '.bl-index-row:has(> .bl-index-row__icon)'
  ],
  'prev-next': ['.bl-prev-next__link--next', '.bl-prev-next__link:hover .bl-prev-next__title'],
  prose: ['counter(bl-section, decimal-leading-zero)', '.bl-prose :not(pre) > code']
}

describe.each(Object.entries(REQUIRED))('css/components/%s.css', (name, selectors) => {
  it.each(selectors)('defines %s', (selector) => {
    expect(read(name)).toContain(selector)
  })
})

describe('touch targets', () => {
  it.each([
    ['site-bar', '.bl-site-bar__brand'],
    ['site-bar', '.bl-site-bar__link'],
    ['switch', '.bl-switch'],
    ['btn', '.bl-btn'],
    ['field', '.bl-input'],
    ['field', '.bl-select'],
    ['field', ".bl-range input[type='range']"]
  ])('%s: %s keeps a 44px minimum', (name, selector) => {
    expect(ruleBody(read(name), selector)['min-height']).toBe('44px')
  })

  it('keeps each switch option 44px wide with a hit area reaching 44px tall', () => {
    const css = read('switch')
    const option = ruleBody(css, '.bl-switch__option')
    expect(option.width).toBe('44px')
    expect(option.height).toBe('30px')
    expect(ruleBody(css, '.bl-switch__option::before').inset).toBe('-7px 0')
  })
})

describe('anchored behaviour', () => {
  it('pins the tab bar to the viewport and hides it from 640px up', () => {
    const css = read('tabbar')
    expect(ruleBody(css, '.bl-tabbar').position).toBe('fixed')
    expect(ruleBody(css, '.bl-tabbar', ['@media (min-width: 640px)']).display).toBe('none')
  })

  it('reserves room for the tab bar below 640px only', () => {
    const css = read('tabbar')
    const narrow = ['@media (max-width: 639px)']
    expect(ruleBody(css, 'body:has(.bl-tabbar)', narrow)['padding-bottom']).toBe('80px')
    expect(ruleBody(css, 'html:has(.bl-tabbar)', narrow)['--bl-scroll-offset-bottom']).toBe('96px')
  })

  it('dims a disabled button and blocks pointer events on aria-disabled', () => {
    const css = read('btn')
    const disabled = ruleBody(css, '.bl-btn:disabled')
    expect(disabled.opacity).toBe('0.45')
    expect(disabled.cursor).toBe('not-allowed')
    expect(ruleBody(css, ".bl-btn[aria-disabled='true']")['pointer-events']).toBe('none')
  })

  it('slides the switch thumb one 44px option per step', () => {
    const css = read('switch')
    expect(
      ruleBody(css, ".bl-switch__track:has(input[value='light']:checked)::before").transform
    ).toBe('translateX(44px)')
    expect(
      ruleBody(css, ".bl-switch__track:has(input[value='dark']:checked)::before").transform
    ).toBe('translateX(88px)')
  })

  it('lights an on LED in phosphor with a glow', () => {
    const on = ruleBody(read('led'), '.bl-led--on')
    expect(on.background).toBe('var(--bl-phosphor)')
    expect(on['box-shadow']).toBe('var(--bl-shadow-glow) var(--bl-phosphor)')
  })

  it('draws a trace-coloured focus outline on the switch track', () => {
    const focus = ruleBody(read('switch'), '.bl-switch__track:has(input:focus-visible)')
    expect(focus.outline).toBe('2px solid var(--bl-trace)')
  })
})

describe('text on tints (spec §4.1)', () => {
  it('bl-msg--ok uses ink-1 text and carries phosphor in the LED mark', () => {
    const css = read('msg')
    expect(css).toMatch(/\.bl-msg--ok\s*\{[^}]*color:\s*var\(--bl-ink-1\)/)
    expect(css).toMatch(/\.bl-msg--ok::before\s*\{[^}]*background:\s*var\(--bl-phosphor\)/)
  })
})
