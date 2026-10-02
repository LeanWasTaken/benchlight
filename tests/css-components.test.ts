// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (name: string) =>
  readFileSync(new URL(`../css/components/${name}.css`, import.meta.url), 'utf8')

// Selectors each component must define; states are ARIA or native attributes.
const REQUIRED: Record<string, string[]> = {
  'site-bar': [
    '.kd-site-bar[data-lifted]',
    '.kd-site-bar__brand',
    ".kd-site-bar__link[aria-current='page']",
    '.kd-site-bar__nav + .kd-site-bar__actions'
  ],
  tabbar: [".kd-tabbar__item[aria-current='page']", 'body:has(.kd-tabbar)'],
  colophon: ['.kd-colophon__inner', '.kd-colophon__items a:hover'],
  'skip-link': ['.kd-skip-link:focus'],
  switch: [
    ".kd-switch__track:has(input[value='light']:checked)::before",
    ".kd-switch__track:has(input[value='dark']:checked)::before",
    '.kd-switch__track:has(input:focus-visible)',
    '.kd-switch__option:has(:checked)'
  ],
  segmented: [
    ".kd-segmented__item[aria-pressed='true']",
    '.kd-segmented__item[aria-current]',
    '.kd-segmented__item:has(:checked)',
    '.kd-segmented--compact .kd-segmented__item'
  ],
  btn: ['.kd-btn--secondary', '.kd-btn--danger', '.kd-btn--pill', '.kd-btn:disabled'],
  field: ['.kd-input:focus-visible', '.kd-select', ".kd-range input[type='range']"],
  'link-arrow': ['.kd-link-arrow::before', '.kd-link-arrow--quiet'],
  'spec-panel': ['.kd-spec-row + .kd-spec-row', '.kd-spec-row__value a'],
  telemetry: [
    '.kd-ruler',
    'var(--kd-telemetry-columns, none)',
    '.kd-telemetry__cell + .kd-telemetry__cell'
  ],
  led: ['.kd-led--on', '.kd-led--danger'],
  eq: ['@keyframes kd-eq', '.kd-eq--active .kd-eq__bar'],
  marquee: ['@property --kd-mask-l', '.kd-marquee[data-overflowing]'],
  readout: ['.kd-readout__value'],
  meter: ['calc(var(--kd-meter-value, 0) * 100%)'],
  msg: ['.kd-msg--ok::before', '.kd-msg--err', '.kd-msg--info'],
  log: ['.kd-ansi-31', '.kd-ansi-97', 'var(--kd-log-height, 200px)'],
  'section-head': ['.kd-section-head--ruled', '.kd-section-head--bar', '.kd-section-head__action'],
  meta: ['.kd-meta__sep', '.kd-meta__key'],
  'index-row': [
    '.kd-index--grid',
    ".kd-index-row[aria-current='true']",
    '.kd-index-row--compact .kd-index-row__title',
    '.kd-index-row:has(> .kd-index-row__icon)'
  ],
  'prev-next': ['.kd-prev-next__link--next', '.kd-prev-next__link:hover .kd-prev-next__title'],
  prose: ['counter(kd-section, decimal-leading-zero)', '.kd-prose :not(pre) > code']
}

describe.each(Object.entries(REQUIRED))('css/components/%s.css', (name, selectors) => {
  it.each(selectors)('defines %s', (selector) => {
    expect(read(name)).toContain(selector)
  })
})

describe('touch targets', () => {
  it.each(['site-bar', 'switch', 'btn', 'field'])('%s keeps a 44px minimum', (name) => {
    expect(read(name)).toContain('min-height: 44px;')
  })
})

describe('text on tints (spec §4.1)', () => {
  it('kd-msg--ok uses ink-1 text and carries phosphor in the LED mark', () => {
    const css = read('msg')
    expect(css).toMatch(/\.kd-msg--ok\s*\{[^}]*color:\s*var\(--kd-ink-1\)/)
    expect(css).toMatch(/\.kd-msg--ok::before\s*\{[^}]*background:\s*var\(--kd-phosphor\)/)
  })
})
