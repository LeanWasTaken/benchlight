// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseRules, ruleBody } from './helpers/css'

const read = (name: string) =>
  readFileSync(new URL(`../css/components/${name}.css`, import.meta.url), 'utf8')

// Selectors each component must define; states are ARIA or native attributes.
const REQUIRED: Record<string, string[]> = {
  media: [
    '.bl-media',
    '.bl-media--center',
    '.bl-media__figure',
    '.bl-media__body',
    '.bl-media__aside'
  ],
  disclosure: [
    '.bl-disclosure',
    '.bl-disclosure__summary',
    '.bl-disclosure__title',
    '.bl-disclosure__chevron',
    '.bl-disclosure__body',
    '.bl-disclosure[open] > .bl-disclosure__summary .bl-disclosure__chevron'
  ],
  toggle: [
    '.bl-toggle',
    '.bl-toggle__control',
    '.bl-toggle__input',
    '.bl-toggle__track',
    '.bl-toggle__thumb',
    '.bl-toggle__label',
    '.bl-toggle__hint',
    '.bl-toggle__input:checked + .bl-toggle__track'
  ],
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
    '--bl-scroll-offset-bottom: calc(96px + env(safe-area-inset-bottom))'
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
    '.bl-btn--ghost',
    '.bl-btn--icon',
    ".bl-btn[aria-pressed='true']",
    '.bl-btn:disabled',
    'pointer-events: none'
  ],
  field: ['.bl-input:focus-visible', '.bl-select', ".bl-range input[type='range']"],
  'link-arrow': ['.bl-link-arrow::before', '.bl-link-arrow--quiet'],
  'spec-panel': ['.bl-spec-row + .bl-spec-row', '.bl-spec-row__value a'],
  telemetry: ['.bl-ruler', '--bl-telemetry-columns', '.bl-telemetry__cell'],
  led: ['.bl-led--on', '.bl-led--danger'],
  eq: ['@keyframes bl-eq', '.bl-eq--active .bl-eq__bar'],
  marquee: ['@property --bl-mask-l', '.bl-marquee[data-overflowing]'],
  readout: ['.bl-readout__value'],
  meter: [
    'calc(var(--bl-meter-value, 0) * 100%)',
    '.bl-meter[data-indeterminate] .bl-meter__fill',
    '@keyframes bl-meter-slide',
    '.bl-meter-field__head',
    '.bl-meter-field__value',
    '@media (prefers-reduced-motion: reduce)'
  ],
  msg: ['.bl-msg--ok::before', '.bl-msg--err', '.bl-msg--info'],
  log: ['.bl-ansi-31', '.bl-ansi-97', 'var(--bl-log-height, 12.5rem)'],
  'section-head': [
    '.bl-section-head--ruled',
    '.bl-section-head--bar',
    '.bl-section-head__action',
    '.bl-section-head:not(.bl-section-head--bar):has(> .bl-section-head__action)'
  ],
  meta: ['.bl-meta--sep > * + *::before', '.bl-meta__key'],
  'index-row': [
    '.bl-index--grid',
    ".bl-index-row[aria-current='true']",
    ".bl-index-row[aria-current='true'] .bl-meta",
    '.bl-index-row--compact .bl-index-row__title',
    '.bl-index-row:has(> .bl-index-row__icon)'
  ],
  'prev-next': ['.bl-prev-next__link--next', '.bl-prev-next__link:hover .bl-prev-next__title'],
  prose: ['counter(bl-section, decimal-leading-zero)', '.bl-prose :not(pre) > code'],
  table: [
    '.bl-table[data-fit]:not(.bl-table--scroll)',
    '.bl-table--scroll .bl-table__scroller',
    '.bl-table[data-measuring] .bl-table__table',
    '.bl-table[data-measuring] *',
    '.bl-table[data-stacked] thead',
    '.bl-table tbody tr[data-action]:focus-within',
    '.bl-table__action',
    "[aria-sort='descending'] > .bl-table__sort .bl-table__sort-icon",
    '@media (forced-colors: active)'
  ],
  pagination: [
    ".bl-pagination__page[aria-current='page']",
    ".bl-pagination [aria-disabled='true']",
    '.bl-pagination__compact'
  ]
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
  it('pins the tab bar to the viewport and hides it from 40em up', () => {
    const css = read('tabbar')
    expect(ruleBody(css, '.bl-tabbar').position).toBe('fixed')
    expect(ruleBody(css, '.bl-tabbar', ['@media (min-width: 40em)']).display).toBe('none')
  })

  it('reserves room for the tab bar below 40em only', () => {
    const css = read('tabbar')
    const narrow = ['@media (max-width: 39.99em)']
    expect(ruleBody(css, 'body:has(.bl-tabbar)', narrow)['padding-bottom']).toBe(
      'calc(80px + env(safe-area-inset-bottom))'
    )
    expect(ruleBody(css, 'html:has(.bl-tabbar)', narrow)['--bl-scroll-offset-bottom']).toBe(
      'calc(96px + env(safe-area-inset-bottom))'
    )
  })

  it('keeps the tab bar and the page column clear of device safe areas', () => {
    const bar = ruleBody(read('tabbar'), '.bl-tabbar')
    expect(bar.bottom).toBe('calc(12px + env(safe-area-inset-bottom))')
    expect(bar.left).toBe('calc(12px + env(safe-area-inset-left))')
    expect(bar.right).toBe('calc(12px + env(safe-area-inset-right))')
    const layout = readFileSync(new URL('../css/layout.css', import.meta.url), 'utf8')
    for (const within of [[], ['@media (max-width: 30em)']]) {
      const gutter = ruleBody(layout, '.bl-col', within)['padding-inline']
      expect(gutter).toMatch(
        /^max\(var\(--bl-layout-gutter(-narrow)?\), env\(safe-area-inset-left\)\)/
      )
      expect(gutter).toMatch(
        /max\(var\(--bl-layout-gutter(-narrow)?\), env\(safe-area-inset-right\)\)$/
      )
    }
  })

  it('shrinks tab bar items and truncates their labels instead of overflowing', () => {
    const css = read('tabbar')
    const item = ruleBody(css, '.bl-tabbar__item')
    expect(item['min-width']).toBe('0')
    expect(item['min-height']).toBe('44px')
    expect(item.padding).toBe('8px 4px')
    const label = ruleBody(css, '.bl-tabbar__label')
    expect(label['text-overflow']).toBe('ellipsis')
    expect(label['white-space']).toBe('nowrap')
    expect(label['max-width']).toBe('100%')
  })

  it('scrolls the site bar nav sideways on one line, keeping the brand ellipsised and the switch fixed', () => {
    const css = read('site-bar')
    const wrap = ruleBody(css, '.bl-site-bar__navwrap')
    expect(wrap['overflow-x']).toBe('auto')
    expect(wrap['min-width']).toBe('0')
    expect(wrap['scroll-padding-inline']).toBe('16px')
    expect(wrap['scrollbar-width']).toBe('none')
    expect(wrap['mask-image']!.replace(/\s+/g, '')).toContain(
      'linear-gradient(toright,transparent,#00012px'
    )
    expect(wrap.padding).toBe('4px 12px')
    expect(wrap.display).toBe('block')
    expect(ruleBody(css, '.bl-site-bar__brand')['text-overflow']).toBe('ellipsis')
    expect(ruleBody(css, '.bl-site-bar__brand')['min-width']).toBe('min(max-content, 7rem)')
    expect(ruleBody(css, '.bl-site-bar__brand > svg')['vertical-align']).toBe('middle')
    expect(ruleBody(css, '.bl-site-bar__actions')['flex-shrink']).toBe('0')
    expect(ruleBody(css, '.bl-site-bar__link')['white-space']).toBe('nowrap')
  })

  it('hides the site bar nav below 40em only when a tab bar replaces it', () => {
    const css = read('site-bar')
    const narrow = ['@media (max-width: 39.99em)']
    expect(ruleBody(css, 'html:has(.bl-tabbar) .bl-site-bar__navwrap', narrow).display).toBe('none')
    expect(() => ruleBody(css, '.bl-site-bar__navwrap', narrow)).toThrow()
  })

  it('lets the site bar scroll away on short screens and zeroes the top scroll offset', () => {
    const css = read('site-bar')
    const short = ['@media (max-height: 30em)']
    expect(ruleBody(css, '.bl-site-bar', short).position).toBe('static')
    expect(ruleBody(css, 'html', short)['--bl-scroll-offset-top']).toBe('0px')
  })

  it('dims a disabled button and blocks pointer events on aria-disabled', () => {
    const css = read('btn')
    const disabled = ruleBody(css, '.bl-btn:disabled')
    expect(disabled.opacity).toBe('0.45')
    expect(disabled.cursor).toBe('not-allowed')
    expect(ruleBody(css, ".bl-btn[aria-disabled='true']")['pointer-events']).toBe('none')
  })

  it('gates button hover behind (hover: hover)', () => {
    const css = read('btn')
    const gate = ['@media (hover: hover)']
    for (const selector of [
      '.bl-btn:hover',
      '.bl-btn--secondary:hover',
      '.bl-btn--danger:hover',
      '.bl-btn--ghost:hover'
    ]) {
      expect(ruleBody(css, selector, gate).background).toBeDefined()
      expect(() => ruleBody(css, selector)).toThrow()
    }
  })

  it('gates field hover behind (hover: hover)', () => {
    const css = read('field')
    const gate = ['@media (hover: hover)']
    for (const selector of ['.bl-input:hover', '.bl-select:hover']) {
      expect(ruleBody(css, selector, gate)['border-color']).toBe('var(--bl-ink-3)')
      expect(() => ruleBody(css, selector)).toThrow()
    }
  })

  it('makes the icon button a 44px square, a circle with pill', () => {
    const css = read('btn')
    const icon = ruleBody(css, '.bl-btn--icon')
    expect(icon['inline-size']).toBe('44px')
    expect(icon.padding).toBe('0')
    expect(ruleBody(css, '.bl-btn--pill.bl-btn--icon').padding).toBe('0')
    expect(ruleBody(css, '.bl-btn--icon .bl-btn__icon').width).toBe('18px')
  })

  it('marks pressed with an inset ring on every variant, not hue alone', () => {
    const css = read('btn')
    expect(ruleBody(css, ".bl-btn[aria-pressed='true']")['box-shadow']).toBe(
      'inset 0 0 0 2px var(--bl-canvas)'
    )
    expect(ruleBody(css, ".bl-btn--danger[aria-pressed='true']").background).toBe(
      'var(--bl-danger)'
    )
    const tinted = ruleBody(css, ".bl-btn--ghost[aria-pressed='true']")
    expect(tinted['box-shadow']).toBe('inset 0 0 0 1px var(--bl-trace)')
  })

  it('gives pressed buttons hover feedback only where hover exists', () => {
    const css = read('btn')
    const gate = ['@media (hover: hover)']
    for (const selector of [
      ".bl-btn[aria-pressed='true']:hover",
      ".bl-btn--danger[aria-pressed='true']:hover",
      ".bl-btn--secondary[aria-pressed='true']:hover",
      ".bl-btn--ghost[aria-pressed='true']:hover"
    ]) {
      expect(ruleBody(css, selector, gate).background).toBeDefined()
      expect(() => ruleBody(css, selector)).toThrow()
    }
  })

  it('keeps the pressed state visible in forced colors', () => {
    const rule = ruleBody(read('btn'), ".bl-btn[aria-pressed='true']", [
      '@media (forced-colors: active)'
    ])
    expect(rule.background).toBe('Highlight')
    expect(rule.color).toBe('HighlightText')
    expect(rule['forced-color-adjust']).toBe('none')
    expect(rule['box-shadow']).toBe('inset 0 0 0 2px HighlightText')
  })

  it('lets the meter field own the block margin and wrap its head', () => {
    const css = read('meter')
    expect(ruleBody(css, '.bl-meter-field').margin).toBe('16px 0')
    expect(ruleBody(css, '.bl-meter-field > .bl-meter').margin).toBe('0')
    expect(ruleBody(css, '.bl-meter-field__head')['flex-wrap']).toBe('wrap')
    expect(ruleBody(css, '.bl-meter-field__value')['font-variant-numeric']).toBe('tabular-nums')
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

describe('intrinsic wrapping (long tokens never widen the page)', () => {
  const type = readFileSync(new URL('../css/type.css', import.meta.url), 'utf8')
  const tokens = readFileSync(new URL('../css/tokens.css', import.meta.url), 'utf8')

  it('readout wraps and breaks long values', () => {
    const css = read('readout')
    expect(ruleBody(css, '.bl-readout')['flex-wrap']).toBe('wrap')
    expect(ruleBody(css, '.bl-readout')['max-width']).toBe('100%')
    expect(ruleBody(css, '.bl-readout__value')['min-width']).toBe('0')
    expect(ruleBody(css, '.bl-readout__value')['overflow-wrap']).toBe('anywhere')
  })

  it('button shrinks to its container and breaks long labels', () => {
    const btn = ruleBody(read('btn'), '.bl-btn')
    expect(btn['max-width']).toBe('100%')
    expect(btn['min-width']).toBe('0')
    expect(btn['overflow-wrap']).toBe('anywhere')
    expect(btn['text-align']).toBe('center')
  })

  it('field shrinks and breaks hint and label text', () => {
    const css = read('field')
    expect(ruleBody(css, '.bl-field')['min-width']).toBe('0')
    expect(ruleBody(css, '.bl-field__hint')['overflow-wrap']).toBe('anywhere')
    expect(ruleBody(css, '.bl-field__label')['overflow-wrap']).toBe('anywhere')
  })

  it('inputs reach 16px on coarse pointers only (no iOS focus zoom)', () => {
    const css = read('field')
    expect(ruleBody(css, '.bl-input', ['@media (pointer: coarse)'])['font-size']).toBe('1rem')
    expect(ruleBody(css, '.bl-select', ['@media (pointer: coarse)'])['font-size']).toBe('1rem')
    expect(ruleBody(css, '.bl-input')['font-size']).toBe('var(--bl-text-small)')
  })

  it('segmented clamps to its container and breaks item text', () => {
    const css = read('segmented')
    expect(ruleBody(css, '.bl-segmented')['max-width']).toBe('100%')
    expect(ruleBody(css, '.bl-segmented__item')['overflow-wrap']).toBe('anywhere')
  })

  it('link-arrow and colophon items break long words', () => {
    const arrow = ruleBody(read('link-arrow'), '.bl-link-arrow')
    expect(arrow['max-width']).toBe('100%')
    expect(arrow['overflow-wrap']).toBe('anywhere')
    const items = ruleBody(read('colophon'), '.bl-colophon__items')
    expect(items['min-width']).toBe('0')
    expect(items['overflow-wrap']).toBe('anywhere')
  })

  it('table action underline is hover-gated', () => {
    const css = read('table')
    expect(
      ruleBody(css, '.bl-table__action:hover', ['@media (hover: hover)'])['text-decoration']
    ).toBe('underline')
    expect(() => ruleBody(css, '.bl-table__action:hover')).toThrow()
  })

  it('prose contains media, tables and long text', () => {
    const css = read('prose')
    expect(ruleBody(css, '.bl-prose')['overflow-wrap']).toBe('break-word')
    expect(ruleBody(css, '.bl-prose')['max-width']).toBe('min(var(--bl-layout-prose), 68ch)')
    expect(ruleBody(css, '.bl-prose :is(img, video, iframe, svg, canvas)')['max-width']).toBe(
      '100%'
    )
    const table = ruleBody(css, '.bl-prose table')
    expect(table.display).toBe('block')
    expect(table['overflow-x']).toBe('auto')
    expect(ruleBody(css, '.bl-prose hr')['border-top']).toContain('var(--bl-separator)')
    expect(ruleBody(css, '.bl-prose :not(pre) > code')['overflow-wrap']).toBe('anywhere')
    expect(ruleBody(css, '.bl-prose ol')['padding-left']).toBe('1.75em')
    expect(ruleBody(type, '.bl-lede')['max-width']).toBe('min(var(--bl-layout-prose), 68ch)')
  })

  it('msg text, range, segmented, log and marquee keep their content responsive', () => {
    expect(ruleBody(read('msg'), '.bl-msg__text')['min-width']).toBe('0')
    const field = read('field')
    expect(ruleBody(field, ".bl-range input[type='range']")['min-width']).toBe('96px')
    expect(ruleBody(field, '.bl-range')['flex-wrap']).toBe('wrap')
    const value = ruleBody(field, '.bl-range__value')
    expect(value['min-width']).toBe('var(--bl-range-value-width, 56px)')
    expect(value['max-width']).toBe('50%')
    expect(value['overflow-wrap']).toBe('anywhere')
    const seg = read('segmented')
    const segmented = ruleBody(seg, '.bl-segmented')
    expect(segmented['row-gap']).toBe('16px')
    expect(segmented['column-gap']).toBe('4px')
    expect(segmented['border-radius']).toBe('17px')
    expect(ruleBody(seg, '.bl-segmented__item')['min-width']).toBe('44px')
    expect(ruleBody(seg, '.bl-segmented__item::before').inset).toBe('-8px 0')
    expect(ruleBody(seg, '.bl-segmented--compact .bl-segmented__item::before').inset).toBe('-9px 0')
    const log = ruleBody(read('log'), '.bl-log')
    expect(log['font-size']).toBe('0.75rem')
    expect(log['overflow-wrap']).toBe('anywhere')
    expect(log['word-break']).toBeUndefined()
    const marquee = read('marquee')
    expect(marquee).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[^@]*\.bl-marquee__content\s*\{[^}]*white-space:\s*normal/
    )
    const reduced = marquee.slice(marquee.indexOf('prefers-reduced-motion'))
    expect(reduced).toMatch(/\.bl-marquee\s*\{[^}]*overflow:\s*visible/)
    expect(reduced).toMatch(/\.bl-marquee__content\s*\{[^}]*overflow-wrap:\s*anywhere/)
    expect(marquee).toMatch(/\.bl-marquee\[data-overflowing\]\s*\{[^}]*mask:\s*none/)
  })

  it('site bar controls never scroll the window on focus while the bar is sticky', () => {
    const css = read('site-bar')
    expect(css).toMatch(/\.bl-site-bar select\s*\{\s*scroll-margin-block:\s*-100px/)
    expect(css).toMatch(/@media \(max-height: 30em\)[\s\S]*scroll-margin-block:\s*0/)
  })

  it('index row hover only applies where hover exists', () => {
    const css = read('index-row')
    expect(css).toMatch(/@media \(hover: hover\)\s*\{\s*a\.bl-index-row:hover/)
    expect(css.replace(/@media \(hover: hover\)\s*\{[\s\S]*?\n {2}\}/, '')).not.toMatch(/:hover/)
  })

  it('meta separators are pseudo-elements with alt text, not elements', () => {
    const css = read('meta')
    expect(css).toMatch(/\.bl-meta--sep > \* \+ \*::before\s*\{[^}]*content:\s*'—'/)
    expect(css).toContain("content: '—' / ''")
    expect(css).not.toContain('.bl-meta__sep')
  })

  it('index row, meta and section head break long tokens', () => {
    const row = read('index-row')
    expect(ruleBody(row, '.bl-index-row__title')['overflow-wrap']).toBe('break-word')
    expect(ruleBody(row, '.bl-index-row__desc')['overflow-wrap']).toBe('break-word')
    expect(ruleBody(read('meta'), '.bl-meta > *')['overflow-wrap']).toBe('anywhere')
    expect(ruleBody(read('section-head'), '.bl-section-head__heading')['overflow-wrap']).toBe(
      'break-word'
    )
  })

  it('display type breaks and its fluid floors fit phone widths', () => {
    expect(ruleBody(type, '.bl-display')['overflow-wrap']).toBe('break-word')
    expect(tokens).toContain('--bl-text-display-xl: clamp(2.5rem, 1rem + 7vw, 6rem)')
    expect(tokens).toContain('--bl-text-display-lg: clamp(1.875rem, 0.75rem + 5vw, 3.375rem)')
  })

  it('telemetry values and spec labels wrap inside their cells', () => {
    const value = ruleBody(read('telemetry'), '.bl-telemetry__value')
    expect(value['min-width']).toBe('0')
    expect(value['overflow-wrap']).toBe('anywhere')
    expect(value['flex-wrap']).toBe('wrap')
    const panel = read('spec-panel')
    expect(ruleBody(panel, '.bl-spec-row__label')['min-width']).toBe('0')
    expect(ruleBody(panel, '.bl-spec-row__value')['min-width']).toBe('0')
    expect(ruleBody(panel, '.bl-spec-row__label')['overflow-wrap']).toBe('anywhere')
  })
})

describe('container-aware layouts', () => {
  const body = (name: string, selector: string, within: string[] = []) =>
    ruleBody(read(name), selector, within)

  it('sizes telemetry, spec panel and colophon intrinsically (no size containment)', () => {
    for (const name of ['telemetry', 'spec-panel', 'colophon'])
      expect(read(name)).not.toMatch(/container-type|@container|@media \((?:min|max)-width/)
    expect(body('spec-panel', '.bl-spec-row')['flex-wrap']).toBe('wrap')
    expect(body('spec-panel', '.bl-spec-row__label')['flex']).toBe('0 1 8rem')
    expect(body('colophon', '.bl-colophon__inner')['flex-wrap']).toBe('wrap')
  })

  it('draws telemetry dividers as borders in forced colours', () => {
    const cell = body('telemetry', '.bl-telemetry__cell', ['@media (forced-colors: active)'])
    expect(cell['box-shadow']).toBe('none')
    expect(cell['border-left']).toBe('1px solid CanvasText')
  })

  it('lays six telemetry cells out 3x2 unless columns are set', () => {
    const six = body('telemetry', '.bl-telemetry__cells:has(> :nth-child(6):last-child)')
    expect(six['grid-template-columns']).toMatch(/--bl-telemetry-columns/)
    expect(six['grid-template-columns']).toContain('/ 3')
  })

  it('lets telemetry columns auto-fit and still honours --bl-telemetry-columns', () => {
    expect(body('telemetry', '.bl-telemetry__cells')['grid-template-columns']).toMatch(
      /^var\(\s*--bl-telemetry-columns,\s*repeat\(auto-fit, minmax\(min\(100%, 12rem\), 1fr\)\)\s*\)$/
    )
  })

  it('keeps prev-next tracks and links shrinkable so long titles cannot widen the page', () => {
    expect(body('prev-next', '.bl-prev-next')['grid-template-columns']).toBe(
      'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))'
    )
    expect(body('prev-next', '.bl-prev-next__link')['min-width']).toBe('0')
    const title = body('prev-next', '.bl-prev-next__title')
    expect(title['overflow-wrap']).toBe('anywhere')
    expect(title['white-space']).toBeUndefined()
    expect(body('prev-next', '.bl-prev-next__link:only-child')['max-width']).toContain('50%')
  })

  it('sizes the index grid from the container width without a breakpoint', () => {
    expect(body('index-row', '.bl-index--grid')['grid-template-columns']).toBe(
      'repeat(auto-fill, minmax(min(100%, 22rem), 1fr))'
    )
  })

  it('gives the section head action room without collapsing the heading', () => {
    const css = read('section-head')
    expect(
      ruleBody(css, '.bl-section-head:not(.bl-section-head--bar):has(> .bl-section-head__action)')[
        'grid-template-columns'
      ]
    ).toBe('minmax(0, 1fr) fit-content(40%)')
    expect(ruleBody(css, '.bl-section-head--bar')['flex-wrap']).toBe('wrap')
    expect(ruleBody(css, '.bl-section-head__action')['flex-shrink']).toBeUndefined()
  })

  it('keeps the link-arrow hit area at least 44px wide', () => {
    expect(body('link-arrow', '.bl-link-arrow')['min-width']).toBe('44px')
  })
})

describe('select chevron', () => {
  const css = read('field')

  it('drops the native arrow only for a single-line select inside the wrapper', () => {
    const rule = ruleBody(css, '.bl-select-wrap > .bl-select:not([multiple], [size])')
    expect(rule.appearance).toBe('none')
    expect(rule['padding-inline-end']).toBe('40px')
    expect(ruleBody(css, '.bl-select')['appearance']).toBeUndefined()
  })

  it('lays the wrapper out like the full-width select', () => {
    const wrap = ruleBody(css, '.bl-select-wrap')
    expect(wrap.display).toBe('block')
    expect(wrap.position).toBe('relative')
    expect(wrap['min-width']).toBe('0')
    expect(wrap['--bl-chevron-mask']).toBeUndefined()
  })

  it('draws the chevron as a themed mask, inset 16px, ignoring the pointer', () => {
    const chevron = ruleBody(css, '.bl-select-wrap::after')
    for (const prop of ['-webkit-mask', 'mask']) {
      expect(chevron[prop]).toMatch(
        /^var\(\s*--bl-chevron-mask,\s*url\("data:image\/svg\+xml,.*"\)\s*\) center \/ contain no-repeat$/
      )
    }
    expect(chevron.background).toBe('var(--bl-ink-2)')
    expect(chevron['inset-inline-end']).toBe('16px')
    expect(chevron['pointer-events']).toBe('none')
    expect(chevron).not.toHaveProperty('right')
  })

  it('brightens on hover only where hover exists, and dims when disabled', () => {
    const sel = '.bl-select-wrap:hover:not(:has(> .bl-select:disabled))::after'
    const hover = ruleBody(css, sel, ['@media (hover: hover)'])
    expect(hover.background).toBe('var(--bl-ink-1)')
    expect(() => ruleBody(css, sel)).toThrow()
    const off = ruleBody(css, '.bl-select-wrap:has(> .bl-select:disabled)::after')
    expect(off.opacity).toBe('0.45')
  })

  it('keeps the chevron visible in forced colors', () => {
    const forced = ruleBody(css, '.bl-select-wrap::after', ['@media (forced-colors: active)'])
    expect(forced['forced-color-adjust']).toBe('none')
    expect(forced.background).toBe('CanvasText')
    const off = ruleBody(css, '.bl-select-wrap:has(> .bl-select:disabled)::after', [
      '@media (forced-colors: active)'
    ])
    expect(off.background).toBe('GrayText')
    expect(off.opacity).toBe('1')
  })
})

describe('themed scrollbars', () => {
  // Each scroller is styled in its own component file so a module bundle stays self-contained.
  const scrollers: Record<string, string[]> = {
    log: ['.bl-log'],
    table: ['.bl-table', '.bl-table--scroll .bl-table__scroller'],
    prose: ['.bl-prose pre', '.bl-prose table']
  }

  it.each(Object.entries(scrollers).flatMap(([file, list]) => list.map((s) => [file, s] as const)))(
    '%s: %s gets a thin, visible, themed thumb',
    (file, selector) => {
      const rule = ruleBody(read(file), selector)
      expect(rule['scrollbar-width']).toBe('thin')
      expect(rule['scrollbar-color']).toBe('var(--bl-control-border) transparent')
    }
  )

  it('themes the page scrollbar on a transparent track, inherited by every scroller', () => {
    const root = ruleBody(readFileSync(new URL('../css/base.css', import.meta.url), 'utf8'), 'html')
    expect(root['scrollbar-color']).toBe('var(--bl-control-border) transparent')
    expect(root['scrollbar-width']).toBeUndefined()
  })
  it('draws a 1px edge beside a classic page scrollbar only', () => {
    const supports = ['@supports (scrollbar-color: auto)']
    const edge = ruleBody(
      readFileSync(new URL('../css/base.css', import.meta.url), 'utf8'),
      'html::after',
      supports
    )
    expect(edge['position']).toBe('fixed')
    expect(edge['inline-size']).toBe('max(0px, min(1px, 100vw - 100%))')
    expect(edge['pointer-events']).toBe('none')
    const base = readFileSync(new URL('../css/base.css', import.meta.url), 'utf8')
    expect(ruleBody(base, 'html:dir(rtl)::after', supports).display).toBe('none')
  })

  it('themes every scrolling rule in the library, except the hidden-scrollbar nav', () => {
    for (const file of readdirSync(new URL('../css/components', import.meta.url))) {
      const name = file.replace(/\.css$/, '')
      for (const rule of parseRules(read(name))) {
        const d = rule.declarations
        const scrolls = ['overflow', 'overflow-x', 'overflow-y'].some((p) =>
          /\b(auto|scroll)\b/.test(d[p] ?? '')
        )
        if (!scrolls) continue
        if (d['scrollbar-width'] === 'none') continue
        expect(d['scrollbar-color'], `${name}.css: ${rule.selectors.join(', ')}`).toBe(
          'var(--bl-control-border) transparent'
        )
      }
    }
    expect(ruleBody(read('site-bar'), '.bl-site-bar__navwrap')['scrollbar-width']).toBe('none')
  })
})

describe('toggle', () => {
  const css = read('toggle')
  it('is a 44px row with a 40x24 track', () => {
    expect(ruleBody(css, '.bl-toggle__control')['min-block-size']).toBe('44px')
    const track = ruleBody(css, '.bl-toggle__track')
    expect(track['inline-size']).toBe('40px')
    expect(track['block-size']).toBe('24px')
  })
  it('reads as disabled in forced colors whether on or off', () => {
    const forced = ['@media (forced-colors: active)']
    expect(ruleBody(css, '.bl-toggle__input:disabled + .bl-toggle__track', forced).background).toBe(
      'Canvas'
    )
    expect(
      ruleBody(css, '.bl-toggle__control:has(> .bl-toggle__input:disabled)', forced).color
    ).toBe('GrayText')
    // Declared after the :checked rules of equal specificity, so disabled wins when both match.
    const rules = parseRules(css).filter((r) => r.within.includes(forced[0]!))
    const at = (sel: string) => rules.findIndex((r) => r.selectors.includes(sel))
    expect(at('.bl-toggle__input:disabled + .bl-toggle__track')).toBeGreaterThan(
      at('.bl-toggle__input:checked + .bl-toggle__track')
    )
  })
  it('moves the thumb with a logical inset so RTL flips it', () => {
    expect(
      ruleBody(css, '.bl-toggle__input:checked + .bl-toggle__track .bl-toggle__thumb')[
        'inset-inline-start'
      ]
    ).toBe('calc(100% - 20px)')
  })
  it('gates hover behind (hover: hover)', () => {
    expect(css.replace(/@media \(hover: hover\)\s*\{[\s\S]*?\n {2}\}/, '')).not.toMatch(/:hover/)
  })
})

describe('media', () => {
  it('lets the body wrap below the figure instead of overflowing', () => {
    const body = ruleBody(read('media'), '.bl-media__body')
    expect(body['flex']).toBe('1 1 12rem')
    expect(body['min-inline-size']).toBe('0')
  })
})

describe('disclosure', () => {
  const css = read('disclosure')
  it('has a 44px summary row', () => {
    expect(ruleBody(css, '.bl-disclosure__summary')['min-block-size']).toBe('44px')
  })
  it('gates hover behind (hover: hover)', () => {
    // Strip every (hover: hover) block, nested ones included, by brace depth.
    let ungated = ''
    for (let i = 0; i < css.length;) {
      const at = css.indexOf('@media (hover: hover)', i)
      if (at < 0) {
        ungated += css.slice(i)
        break
      }
      ungated += css.slice(i, at)
      let depth = 0
      let j = css.indexOf('{', at)
      for (; j < css.length; j++) {
        if (css[j] === '{') depth++
        else if (css[j] === '}' && --depth === 0) break
      }
      i = j + 1
    }
    expect(css).toMatch(/:hover/)
    expect(ungated).not.toMatch(/:hover/)
  })
})
