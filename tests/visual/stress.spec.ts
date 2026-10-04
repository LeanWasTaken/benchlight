import { expect, test, type Page } from '@playwright/test'

/**
 * Responsiveness regression suite. Every case on /stress.html is loaded alone (?case=<id>) and
 * checked at many viewport widths, at 200% root font size and inside a 280px container.
 * Runs only in the desktop-light project (see playwright.config.ts) because it sets its own
 * viewports. STRESS_BREAK=overflow|stack|small|overlap deliberately breaks layout to prove the
 * checks can fail.
 */

const WIDTHS = [320, 360, 390, 414, 480, 600, 640, 768, 1024, 1280, 1920]
const HEIGHT = 900

interface Variant {
  name: string
  width: number
  root: number
  narrow: boolean
}

const widthVariants: Variant[] = WIDTHS.map((width) => ({
  name: `w${width}`,
  width,
  root: 100,
  narrow: false
}))
const rootVariants: Variant[] = [320, 640].map((width) => ({
  name: `w${width}-root200`,
  width,
  root: 200,
  narrow: false
}))
const narrowVariant: Variant = { name: 'narrow280', width: 1440, root: 100, narrow: true }
const ALL = [...widthVariants, ...rootVariants, narrowVariant]

const only = (...names: string[]) => ALL.filter((v) => names.includes(v.name))
const between = (min: number, max: number) =>
  widthVariants.filter((v) => v.width >= min && v.width <= max)

// Elements that are meant to scroll or clip their own content.
const SCROLLERS = 'pre, .bl-log, .bl-prose table, .bl-prose table *, .bl-marquee, .bl-sr-only'

async function openVariant(page: Page, id: string, v: Variant): Promise<void> {
  await page.setViewportSize({ width: v.width, height: HEIGHT })
  await page.goto(`/stress.html?case=${id}`)
  await page.evaluate(() => document.fonts.ready)
  // Bite-proof hook: STRESS_BREAK deliberately breaks layout so passing checks can be shown to fail.
  if (process.env.STRESS_BREAK === 'overflow')
    await page.addStyleTag({
      content:
        '[data-box] > *, .bl-site-bar, .bl-tabbar { width: 2000px !important; min-width: 2000px !important; }'
    })
  if (process.env.STRESS_BREAK === 'stack')
    await page.addStyleTag({
      content:
        '[data-box] *, .bl-site-bar * { position: absolute !important; left: 0 !important; top: 0 !important; } .bl-site-bar, .bl-tabbar { height: 300px !important; } .bl-tabbar__item { margin-left: 2000px !important; }'
    })
  if (process.env.STRESS_BREAK === 'small')
    await page.addStyleTag({
      content: '.bl-site-bar__link { min-height: 20px !important; padding: 0 !important; }'
    })
  if (process.env.STRESS_BREAK === 'overlap')
    await page.addStyleTag({
      content:
        '.bl-section-head__eyebrow, .bl-section-head__heading, .bl-section-head__action { position: absolute !important; left: 0 !important; top: 0 !important; width: 100px !important; height: 30px !important; }'
    })
  await page.evaluate(
    ({ root, narrow }) => {
      document.documentElement.style.fontSize = `${root}%`
      if (narrow) {
        document.querySelectorAll<HTMLElement>('[data-box]').forEach((box) => {
          box.style.width = '280px'
        })
      }
      // Reduced motion gives every property a 0.01ms transition (css/base.css); wait for the
      // style change to settle so computed values read the end state.
      return new Promise<void>((resolve) => {
        const started = performance.now()
        const poll = () =>
          document.getAnimations().filter((a) => a instanceof CSSTransition).length === 0 ||
          performance.now() - started > 1000
            ? resolve()
            : requestAnimationFrame(poll)
        requestAnimationFrame(poll)
      })
    },
    { root: v.root, narrow: v.narrow }
  )
}

type Probe = (page: Page, v: Variant) => Promise<string | null>

/** Page never scrolls sideways. */
const noPageOverflow: Probe = (page) =>
  page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth <= window.innerWidth
      ? null
      : `page scrollWidth ${doc.scrollWidth} > innerWidth ${window.innerWidth}`
  })

/** notClipped: no text container clips or overflows its content, and nothing sticks out of the case box. */
const clipped =
  (scope = '[data-case]'): Probe =>
  (page) =>
    page.evaluate(
      ({ scope, scrollers }) => {
        const root = document.querySelector(scope)
        if (!root) return `no element for ${scope}`
        const skip = (el: Element) => el.matches(scrollers) || !!el.closest(scrollers)
        const bad: string[] = []
        for (const el of root.querySelectorAll<HTMLElement>('*')) {
          if (skip(el)) continue
          const cs = getComputedStyle(el)
          if (cs.display === 'inline' || cs.display === 'none' || el.clientWidth === 0) continue
          if (el.scrollWidth > el.clientWidth + 1)
            bad.push(
              `${el.className || el.tagName}: scrollWidth ${el.scrollWidth} > ${el.clientWidth}`
            )
        }
        const box = root.querySelector('[data-box]') ?? root
        const limit = box.getBoundingClientRect().right + 1
        for (const el of box.querySelectorAll<HTMLElement>('*')) {
          if (skip(el)) continue
          const r = el.getBoundingClientRect()
          if (r.width > 1 && r.height > 1 && r.right > limit)
            bad.push(
              `${el.className || el.tagName}: right ${Math.round(r.right)} > box ${Math.round(limit)}`
            )
        }
        return bad.length ? [...new Set(bad)].slice(0, 4).join('; ') : null
      },
      { scope, scrollers: SCROLLERS }
    )

/** Text boxes matched by `selectors` neither overflow nor stick out of the case box (the row's own hover bleed is ignored). */
const textInsideBox =
  (selectors: string): Probe =>
  (page) =>
    page.evaluate((selectors) => {
      const box = document.querySelector('[data-box]')
      if (!box) return 'no [data-box]'
      const limit = box.getBoundingClientRect().right + 1
      const bad: string[] = []
      for (const el of box.querySelectorAll<HTMLElement>(selectors)) {
        if (el.scrollWidth > el.clientWidth + 1)
          bad.push(`${el.className}: scrollWidth ${el.scrollWidth} > ${el.clientWidth}`)
        const r = el.getBoundingClientRect()
        if (r.right > limit)
          bad.push(`${el.className}: right ${Math.round(r.right)} > ${Math.round(limit)}`)
      }
      return bad.length ? [...new Set(bad)].slice(0, 4).join('; ') : null
    }, selectors)

/** The case box really is the expected width (guards against probes that never exercise the container). */
const boxWidth =
  (expected: number): Probe =>
  (page) =>
    page.evaluate((expected) => {
      const w = document.querySelector('[data-box]')?.getBoundingClientRect().width ?? 0
      return Math.abs(w - expected) <= 0.5 ? null : `[data-box] is ${w}px, expected ${expected}`
    }, expected)

/** Computed `property` of the first `selector` match equals `expected`. */
const computed =
  (selector: string, property: string, expected: string): Probe =>
  (page) =>
    page.evaluate(
      ({ selector, property, expected }) => {
        const el = document.querySelector(selector)
        if (!el) return `no element for ${selector}`
        const value = getComputedStyle(el).getPropertyValue(property)
        return value === expected
          ? null
          : `${selector} ${property} is ${value}, expected ${expected}`
      },
      { selector, property, expected }
    )

/** The ::before hit area of every .bl-link-arrow is at least 44x44 and stays inside the viewport. */
const linkArrowHitArea: Probe = (page) =>
  page.evaluate(() => {
    for (const el of document.querySelectorAll<HTMLElement>('.bl-link-arrow')) {
      const r = el.getBoundingClientRect()
      const before = getComputedStyle(el, '::before')
      const left = parseFloat(before.left)
      const right = parseFloat(before.right)
      const top = parseFloat(before.top)
      const bottom = parseFloat(before.bottom)
      const width = r.width - left - right
      const height = r.height - top - bottom
      if (width < 43.5 || height < 43.5)
        return `hit area ${Math.round(width)}x${Math.round(height)} < 44x44`
      if (r.left + left < -0.5 || r.right - right > window.innerWidth + 0.5)
        return 'hit area sticks out of the viewport'
    }
    return null
  })

/** `b` starts below the bottom of `a` (the two are stacked, not side by side). */
const stackedBelow =
  (a: string, b: string): Probe =>
  (page) =>
    page.evaluate(
      ({ a, b }) => {
        const ra = document.querySelector(a)?.getBoundingClientRect()
        const rb = document.querySelector(b)?.getBoundingClientRect()
        if (!ra || !rb) return 'missing element'
        return rb.top >= ra.bottom - 0.5 ? null : `${b} is not below ${a}`
      },
      { a, b }
    )

/** Boxes of `a` and `b` (first match each) do not intersect. */
const noOverlap =
  (a: string, b: string): Probe =>
  (page) =>
    page.evaluate(
      ({ a, b }) => {
        const ea = document.querySelector(a)
        const eb = document.querySelector(b)
        if (!ea || !eb) return `missing ${!ea ? a : b}`
        const ra = ea.getBoundingClientRect()
        const rb = eb.getBoundingClientRect()
        const hit =
          ra.left < rb.right - 0.5 &&
          rb.left < ra.right - 0.5 &&
          ra.top < rb.bottom - 0.5 &&
          rb.top < ra.bottom - 0.5
        return hit ? `${a} overlaps ${b}` : null
      },
      { a, b }
    )

/** Consecutive siblings matched by `selector` do not intersect. */
const noSiblingOverlap =
  (selector: string): Probe =>
  (page) =>
    page.evaluate((selector) => {
      const rects = [...document.querySelectorAll(selector)].map((e) => e.getBoundingClientRect())
      for (let i = 0; i < rects.length; i++)
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i]!
          const b = rects[j]!
          if (
            a.left < b.right - 0.5 &&
            b.left < a.right - 0.5 &&
            a.top < b.bottom - 0.5 &&
            b.top < a.bottom - 0.5
          )
            return `${selector} #${i} overlaps #${j}`
        }
      return null
    }, selector)

const minTarget =
  (selector: string, size = 44): Probe =>
  (page) =>
    page.evaluate(
      ({ selector, size }) => {
        for (const el of document.querySelectorAll(selector)) {
          const r = el.getBoundingClientRect()
          if (r.width < size - 0.5 || r.height < size - 0.5)
            return `${selector} is ${Math.round(r.width)}x${Math.round(r.height)} < ${size}`
        }
        return null
      },
      { selector, size }
    )

/** Every match lies fully inside the viewport horizontally. */
const visibleInViewport =
  (selector: string): Probe =>
  (page) =>
    page.evaluate((selector) => {
      const els = [...document.querySelectorAll(selector)]
      if (!els.length) return `no match for ${selector}`
      for (const el of els) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.left < -0.5 || r.right > window.innerWidth + 0.5)
          return `${selector} at ${Math.round(r.left)}..${Math.round(r.right)} of ${window.innerWidth}`
      }
      return null
    }, selector)

const maxHeight =
  (selector: string, max: number): Probe =>
  (page) =>
    page.evaluate(
      ({ selector, max }) => {
        const h = document.querySelector(selector)?.getBoundingClientRect().height ?? 0
        return h > 0 && h <= max ? null : `${selector} height ${h} not in (0, ${max}]`
      },
      { selector, max }
    )

const minWidth =
  (selector: string, min: number): Probe =>
  (page) =>
    page.evaluate(
      ({ selector, min }) => {
        const w = document.querySelector(selector)?.getBoundingClientRect().width ?? 0
        return w >= min ? null : `${selector} width ${Math.round(w)} < ${min}`
      },
      { selector, min }
    )

const minFontSize =
  (selector: string, min: number): Probe =>
  (page) =>
    page.evaluate(
      ({ selector, min }) => {
        const el = document.querySelector(selector)
        const px = el ? parseFloat(getComputedStyle(el).fontSize) : 0
        return px >= min ? null : `${selector} font-size ${px}px < ${min}px`
      },
      { selector, min }
    )

/** Nav links are visible in the viewport or inside a horizontal scroller. */
const navReachable: Probe = (page) =>
  page.evaluate(() => {
    const links = [...document.querySelectorAll('.bl-site-bar__link')]
    if (!links.length) return 'no nav links'
    for (const link of links) {
      const r = link.getBoundingClientRect()
      if (r.width === 0) return 'nav link is not rendered'
      if (r.left >= -0.5 && r.right <= window.innerWidth + 0.5) continue
      let scroller: Element | null = link.parentElement
      let scrolls = false
      while (scroller && scroller !== document.body) {
        const cs = getComputedStyle(scroller)
        if (/auto|scroll/.test(cs.overflowX) && scroller.scrollWidth > scroller.clientWidth)
          scrolls = true
        scroller = scroller.parentElement
      }
      if (!scrolls)
        return `nav link at ${Math.round(r.left)}..${Math.round(r.right)} is unreachable`
    }
    return null
  })

/** The brand shows in full (no ellipsis clipping). */
const brandNotTruncated: Probe = (page) =>
  page.evaluate(() => {
    const b = document.querySelector('.bl-site-bar__brand')
    if (!b) return 'no brand'
    return b.scrollWidth <= b.clientWidth + 1
      ? null
      : `brand truncated: scrollWidth ${b.scrollWidth} > clientWidth ${b.clientWidth}`
  })

/** Brand logo and text centre vertically with the appearance switch (within 2px). */
const brandCentred: Probe = (page) =>
  page.evaluate(() => {
    const mid = (el: Element) => {
      const r = el.getBoundingClientRect()
      return (r.top + r.bottom) / 2
    }
    const svg = document.querySelector('.bl-site-bar__brand svg')
    const sw = document.querySelector('.bl-switch')
    if (!svg || !sw) return 'missing logo or switch'
    const range = document.createRange()
    const brand = document.querySelector('.bl-site-bar__brand')!
    range.selectNodeContents(brand.lastChild!)
    const t = range.getBoundingClientRect()
    const textMid = (t.top + t.bottom) / 2
    const target = mid(sw)
    return Math.abs(mid(svg) - target) <= 2 && Math.abs(textMid - target) <= 2
      ? null
      : `logo centre ${mid(svg).toFixed(1)}, text centre ${textMid.toFixed(1)}, switch centre ${target.toFixed(1)}`
  })

/** BlMsg text must flow as one box, not as separate flex/grid items. */
const msgSingleBox: Probe = (page) =>
  page.evaluate(() => {
    const msg = document.querySelector('.bl-msg')
    if (!msg) return 'no .bl-msg'
    const display = getComputedStyle(msg).display
    if (!/flex|grid/.test(display)) return null
    const items = [...msg.childNodes].filter(
      (n) => n.nodeType === 1 || (n.textContent ?? '').trim() !== ''
    )
    return items.length === 1 ? null : `${display} container with ${items.length} items`
  })

/** A wrapped segmented control: row-1 items stay hittable at their bottom edge. */
const segmentedHittable: Probe = (page) =>
  page.evaluate(() => {
    const items = [...document.querySelectorAll<HTMLElement>('.bl-segmented__item')]
    const tops = items.map((i) => Math.round(i.getBoundingClientRect().top))
    const first = Math.min(...tops)
    for (const [index, item] of items.entries()) {
      if (tops[index] !== first) continue
      const r = item.getBoundingClientRect()
      const hit = document.elementFromPoint(r.left + r.width / 2, r.bottom - 2)
      if (!hit || !item.contains(hit)) return `row-1 item ${index} covered by ${hit?.className}`
    }
    return null
  })

/** The last child on each visual line of a BlMeta is never a separator. */
const metaSepNotLast: Probe = (page) =>
  page.evaluate(() => {
    const meta = document.querySelector('.bl-meta')
    if (!meta) return 'no .bl-meta'
    const kids = [...meta.children]
    const lastOnLine = new Map<number, Element>()
    for (const kid of kids) lastOnLine.set(Math.round(kid.getBoundingClientRect().top), kid)
    for (const kid of lastOnLine.values())
      if (kid.classList.contains('bl-meta__sep')) return 'a separator ends a line'
    return null
  })

interface Check {
  name: string
  variants: Variant[]
  probe: Probe
}

interface Case {
  id: string
  checks: Check[]
}

const generic = (variants: Variant[] = ALL): Check[] => [
  { name: 'no-page-overflow', variants, probe: noPageOverflow },
  { name: 'not-clipped', variants, probe: clipped() }
]

const cases: Case[] = [
  // D1: wrapping / intrinsic sizing
  { id: 'readout-long', checks: generic() },
  { id: 'button-long', checks: generic() },
  { id: 'field-hint-url', checks: generic() },
  { id: 'segmented-long', checks: generic() },
  { id: 'link-arrow-long', checks: generic() },
  { id: 'colophon-unbreakable', checks: generic() },
  { id: 'prose', checks: generic() },
  {
    id: 'index-row-long',
    checks: [
      { name: 'no-page-overflow', variants: ALL, probe: noPageOverflow },
      {
        name: 'not-clipped',
        variants: ALL,
        probe: textInsideBox('.bl-index-row__title, .bl-index-row__desc, .bl-index-row__meta')
      }
    ]
  },
  { id: 'meta-hash', checks: generic() },
  { id: 'section-head-compound', checks: generic() },
  { id: 'display-xl', checks: generic(between(320, 390)) },
  {
    id: 'telemetry-long',
    checks: [
      ...generic(),
      { name: 'cells-no-overlap', variants: ALL, probe: noSiblingOverlap('.bl-telemetry__cell') }
    ]
  },
  { id: 'spec-row-long', checks: generic() },

  // D2: container-aware / em based
  {
    id: 'telemetry-4',
    checks: [
      {
        name: 'cells-readable',
        variants: only('narrow280', 'w640'),
        probe: minWidth('.bl-telemetry__cell', 100)
      },
      ...generic(only('narrow280', 'w640')),
      {
        name: 'cells-no-overlap',
        variants: only('narrow280', 'w640'),
        probe: noSiblingOverlap('.bl-telemetry__cell')
      }
    ]
  },
  {
    id: 'telemetry-6',
    checks: [
      {
        name: 'cells-readable',
        variants: only('narrow280', 'w640'),
        probe: minWidth('.bl-telemetry__cell', 100)
      },
      ...generic(only('narrow280', 'w640')),
      {
        name: 'cells-no-overlap',
        variants: only('narrow280', 'w640'),
        probe: noSiblingOverlap('.bl-telemetry__cell')
      }
    ]
  },
  {
    id: 'spec-panel',
    checks: [
      ...generic(only('narrow280')),
      {
        name: 'label-value-no-overlap',
        variants: ALL,
        probe: noOverlap('.bl-spec-row__label', '.bl-spec-row__value')
      },
      { name: 'box-is-280', variants: only('narrow280'), probe: boxWidth(280) },
      {
        name: 'value-readable',
        variants: only('narrow280'),
        probe: minWidth('.bl-spec-row__value', 150)
      }
    ]
  },
  {
    id: 'index-grid',
    checks: [
      { name: 'no-page-overflow', variants: only('narrow280'), probe: noPageOverflow },
      // Rows keep their deliberate 12px hover bleed; measure the text boxes (see index-row-long).
      {
        name: 'not-clipped',
        variants: only('narrow280'),
        probe: textInsideBox('.bl-index-row__title, .bl-index-row__desc, .bl-index-row__meta')
      },
      {
        name: 'one-column',
        variants: only('narrow280'),
        probe: computed('.bl-index--grid', 'grid-template-columns', '280px')
      }
    ]
  },
  {
    id: 'prev-next-long',
    checks: [
      { name: 'no-page-overflow', variants: ALL, probe: noPageOverflow },
      // Links keep their 12px hover bleed (like index rows); measure the text boxes.
      {
        name: 'not-clipped',
        variants: ALL,
        probe: textInsideBox('.bl-prev-next__title, .bl-prev-next__label')
      }
    ]
  },
  {
    id: 'colophon-narrow',
    checks: [
      ...generic(only('narrow280')),
      { name: 'box-is-280', variants: only('narrow280'), probe: boxWidth(280) },
      {
        name: 'stacks-in-container',
        variants: only('narrow280'),
        probe: stackedBelow('.bl-colophon__items', '.bl-colophon__inner > :last-child')
      }
    ]
  },
  ...['flex', 'inline'].flatMap((kind) =>
    ['telemetry', 'spec-panel', 'colophon'].map<Case>((comp) => ({
      id: `host-${kind}-${comp}`,
      checks: [
        { name: 'no-page-overflow', variants: ALL, probe: noPageOverflow },
        { name: 'not-clipped', variants: ALL, probe: clipped() },
        {
          name: 'not-collapsed',
          variants: ALL,
          probe: minWidth(
            comp === 'telemetry'
              ? '.bl-telemetry'
              : comp === 'spec-panel'
                ? '.bl-spec-panel'
                : '.bl-colophon',
            100
          )
        }
      ]
    }))
  ),
  {
    id: 'link-arrow-short',
    checks: [
      { name: 'no-page-overflow', variants: ALL, probe: noPageOverflow },
      { name: 'hit-area-44px', variants: ALL, probe: linkArrowHitArea }
    ]
  },
  {
    id: 'section-head-action',
    checks: [
      {
        name: 'action-not-collapsed',
        variants: ALL,
        probe: minWidth('.bl-section-head__action', 60)
      },
      ...generic(),
      {
        name: 'heading-not-collapsed',
        variants: ALL,
        probe: minWidth('.bl-section-head__heading', 80)
      },
      {
        name: 'heading-action-no-overlap',
        variants: ALL,
        probe: noOverlap('.bl-section-head__heading', '.bl-section-head__action')
      }
    ]
  },
  {
    id: 'section-head-bar-action',
    checks: [
      {
        name: 'action-not-collapsed',
        variants: ALL,
        probe: minWidth('.bl-section-head__action', 60)
      },
      ...generic(),
      {
        name: 'eyebrow-action-no-overlap',
        variants: ALL,
        probe: noOverlap('.bl-section-head__eyebrow', '.bl-section-head__action')
      }
    ]
  },
  {
    id: 'sitebar-4',
    checks: [
      { name: 'no-page-overflow-root200', variants: only('w640-root200'), probe: noPageOverflow },
      {
        name: 'links-44px-targets',
        variants: between(640, 1280),
        probe: minTarget('.bl-site-bar__link', 44)
      }
    ]
  },

  // D3: page chrome (single case per page, no data-box)
  ...[6, 8, 12].map<Case>((n) => ({
    id: `sitebar-${n}`,
    checks: [
      { name: 'no-page-overflow', variants: between(640, 1280), probe: noPageOverflow },
      ...(n === 8
        ? [{ name: 'brand-not-truncated', variants: only('w768'), probe: brandNotTruncated }]
        : []),
      {
        name: 'appearance-switch-visible',
        variants: between(640, 1280),
        probe: visibleInViewport('.bl-switch')
      }
    ]
  })),
  {
    id: 'sitebar-brand-30',
    checks: [
      { name: 'no-page-overflow', variants: only('w320'), probe: noPageOverflow },
      { name: 'switch-visible', variants: only('w320'), probe: visibleInViewport('.bl-switch') }
    ]
  },
  {
    id: 'sitebar-brand-30-nav',
    checks: [
      { name: 'one-line-bar', variants: widthVariants, probe: maxHeight('.bl-site-bar', 72) },
      { name: 'no-page-overflow', variants: widthVariants, probe: noPageOverflow }
    ]
  },
  {
    id: 'sitebar-logo',
    checks: [
      { name: 'logo-text-centred-with-switch', variants: widthVariants, probe: brandCentred },
      { name: 'one-line-bar', variants: widthVariants, probe: maxHeight('.bl-site-bar', 72) }
    ]
  },
  {
    id: 'sitebar-nav-no-tabs',
    checks: [
      {
        name: 'brand-not-truncated',
        variants: only('w320').concat(only('w640')),
        probe: brandNotTruncated
      },
      {
        name: 'switch-visible',
        variants: only('w320').concat(only('w640')),
        probe: visibleInViewport('.bl-switch')
      },
      {
        name: 'no-page-overflow',
        variants: only('w320').concat(only('w640')),
        probe: noPageOverflow
      },
      {
        name: 'nav-reachable-below-640',
        variants: widthVariants.filter((v) => v.width < 640),
        probe: navReachable
      }
    ]
  },
  ...[6, 7].map<Case>((n) => ({
    id: `tabbar-${n}`,
    checks: [
      {
        name: 'no-page-overflow',
        variants: only('w320').concat(only('w360')),
        probe: noPageOverflow
      },
      {
        name: 'tabs-in-viewport',
        variants: only('w320').concat(only('w360')),
        probe: visibleInViewport('.bl-tabbar__item')
      }
    ]
  })),
  {
    id: 'tabbar-long-4',
    checks: [
      { name: 'no-page-overflow', variants: only('w360'), probe: noPageOverflow },
      {
        name: 'tabs-in-viewport',
        variants: only('w360'),
        probe: visibleInViewport('.bl-tabbar__item')
      }
    ]
  },

  // D4: vue-level behaviour
  {
    id: 'msg-link',
    checks: [
      ...generic(),
      { name: 'text-single-box', variants: only('w320', 'w640'), probe: msgSingleBox }
    ]
  },
  {
    id: 'range-long',
    checks: [
      {
        name: 'input-min-width',
        variants: [...only('w320-root200'), ...only('w320')],
        probe: minWidth('.bl-range input', 96)
      }
    ]
  },
  {
    id: 'segmented-12',
    checks: [
      { name: 'no-page-overflow', variants: ALL, probe: noPageOverflow },
      { name: 'row-1-hittable', variants: widthVariants, probe: segmentedHittable }
    ]
  },
  {
    id: 'meta-sep',
    checks: [{ name: 'separator-not-line-end', variants: widthVariants, probe: metaSepNotLast }]
  },
  {
    id: 'log-scale',
    checks: [
      {
        name: 'font-scales-with-root',
        variants: only('w320-root200', 'w640-root200'),
        probe: minFontSize('.bl-log', 20)
      }
    ]
  }
]

test.describe('responsive stress', () => {
  test.describe.configure({ mode: 'parallel' })

  for (const c of cases) {
    for (const check of c.checks) {
      test(`${c.id}/${check.name}`, async ({ page }) => {
        const failures: string[] = []
        for (const v of check.variants) {
          await openVariant(page, c.id, v)
          const problem = await check.probe(page, v)
          if (problem) failures.push(`${v.name}: ${problem}`)
        }
        expect(failures, failures.join('\n')).toEqual([])
      })
    }
  }
})

// at 568x320 the site bar stops being sticky and keyboard focus is never hidden behind chrome.
for (const id of ['tabbar-6', 'sitebar-nav-no-tabs']) {
  test(`short-landscape focus walk (${id})`, async ({ page }) => {
    await page.setViewportSize({ width: 568, height: 320 })
    await page.goto(`/stress.html?case=${id}`)
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => {
      const main = document.querySelector('main')!
      for (let i = 0; i < 12; i++) {
        const b = document.createElement('button')
        b.className = 'bl-btn'
        b.textContent = `filler ${i}`
        b.style.cssText = 'display:block;margin-block:60px'
        main.append(b)
      }
    })
    expect(
      await page.evaluate(() => getComputedStyle(document.querySelector('.bl-site-bar')!).position)
    ).toBe('static')
    const total = await page.evaluate(
      () =>
        document.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])').length
    )
    const hidden: string[] = []
    for (let i = 0; i < total + 2; i++) {
      await page.keyboard.press('Tab')
      const problem = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el || el === document.body) return null
        const r = el.getBoundingClientRect()
        const label = `${el.className || el.tagName} "${(el.textContent ?? '').trim().slice(0, 12)}"`
        if (r.width === 0) return null
        let box = { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight }
        for (let p = el.parentElement; p; p = p.parentElement) {
          if (/auto|scroll/.test(getComputedStyle(p).overflowX) && p !== document.documentElement) {
            const pr = p.getBoundingClientRect()
            box = {
              left: Math.max(box.left, pr.left),
              right: Math.min(box.right, pr.right),
              top: box.top,
              bottom: box.bottom
            }
          }
        }
        // Browsers only scroll a partly clipped link into view when its centre is hidden, so the centre must be on screen.
        const cx = (r.left + r.right) / 2
        if (cx < box.left || cx > box.right || r.top < -1 || r.bottom > window.innerHeight + 1)
          return `${label} outside visible area (${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)})`
        const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2)
        if (hit && hit !== el && !el.contains(hit) && !hit.contains(el))
          return `${label} covered by ${hit.className || hit.tagName}`
        return null
      })
      if (problem) hidden.push(problem)
    }
    expect(hidden, hidden.join('\n')).toEqual([])
  })
}

// a focused nav link sits fully inside the scroller's unmasked area (clear of the 12px fade).
test('site-bar nav keeps a focused link clear of the edge fade', async ({ page }) => {
  // Wide enough that the widest link fits between the fades; narrower scrollers cannot avoid them.
  await page.setViewportSize({ width: 560, height: 900 })
  await page.goto('/stress.html?case=sitebar-12')
  await page.evaluate(() => document.fonts.ready)
  const total = await page.locator('.bl-site-bar__link').count()
  const problems: string[] = []
  // Scrolled well down a tall page: revealing a link must not move the window.
  const startY = await page.evaluate(() => {
    const spacer = document.createElement('div')
    spacer.style.height = '3000px'
    document.querySelector('main')!.append(spacer)
    window.scrollTo(0, 800)
    return window.scrollY
  })
  expect(startY).toBe(800)
  await page.locator('.bl-site-bar__link').first().focus({ timeout: 5000 })
  await page.evaluate(() => window.scrollTo(0, 800))
  for (let i = 0; i < total; i++) {
    const problem = await page.evaluate(() => {
      if (window.scrollY !== 800) return `window scrolled to ${window.scrollY}`
      const el = document.activeElement as HTMLElement
      const wrap = document.querySelector('.bl-site-bar__navwrap')!.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      const fade = 12
      const label = `"${(el.textContent ?? '').trim()}"`
      if (r.left < wrap.left + fade - 0.5 || r.right > wrap.right - fade + 0.5)
        return `${label} [${Math.round(r.left)},${Math.round(r.right)}] under the fade of [${Math.round(wrap.left)},${Math.round(wrap.right)}]`
      return null
    })
    if (problem) problems.push(problem)
    await page.keyboard.press('Tab')
  }
  expect(problems, problems.join('\n')).toEqual([])
})

// the appearance switch shares the brand's vertical centre.
for (const width of [390, 1280]) {
  test(`site-bar switch is vertically centred with the brand at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/stress.html?case=sitebar-4')
    await page.evaluate(() => document.fonts.ready)
    const centres = await page.evaluate(() => {
      const mid = (selector: string) => {
        const r = document.querySelector(selector)!.getBoundingClientRect()
        return r.top + r.height / 2
      }
      return { brand: mid('.bl-site-bar__brand'), track: mid('.bl-switch__track') }
    })
    expect(Math.abs(centres.brand - centres.track)).toBeLessThanOrEqual(2)
  })
}
