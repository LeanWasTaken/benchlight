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
  'link-arrow': ['.kd-link-arrow::before', '.kd-link-arrow--quiet']
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
