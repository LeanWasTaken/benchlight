import { expect, test, type Page } from '@playwright/test'

test.use({ reducedMotion: 'no-preference' })

const supported = (page: Page) =>
  page.evaluate(
    () =>
      CSS.supports('selector(::details-content)') &&
      CSS.supports('interpolate-size', 'allow-keywords')
  )

// Click, then sample the body's pseudo-element every frame inside the page (no runner latency).
const sample = (page: Page, index: number, windowMs = 600) =>
  page.evaluate(
    async ([i, windowMs]) => {
      const d = document.querySelectorAll<HTMLDetailsElement>('[data-demo="disclosure"] details')[
        i
      ]!
      const summary = d.querySelector('summary')!
      const wasOpen = d.open
      // Let unrelated page load motion settle so only the disclosure's own shift is measured.
      let top = summary.getBoundingClientRect().top
      for (let stable = 0; stable < 30;) {
        await new Promise((r) => requestAnimationFrame(r))
        const now = summary.getBoundingClientRect().top
        stable = now === top ? stable + 1 : 0
        top = now
      }
      const read = () => {
        const s = getComputedStyle(d, '::details-content')
        return {
          // Without ::details-content the pseudo has no style; measure the body itself then.
          h:
            parseFloat(s.blockSize) ||
            (d.open ? d.querySelector('.bl-disclosure__body')!.getBoundingClientRect().height : 0),
          o: parseFloat(s.opacity),
          rendered: s.contentVisibility !== 'hidden',
          open: d.open,
          top: summary.getBoundingClientRect().top
        }
      }
      summary.click()
      const frames = [read()]
      const start = performance.now()
      while (performance.now() - start < windowMs) {
        await new Promise((r) => requestAnimationFrame(r))
        frames.push(read())
      }
      return { wasOpen, top, frames }
    },
    [index, windowMs] as const
  )

// A multi-second transition guarantees mid-transition frames even on a slow emulated runner.
const SLOW = 2000
const slow = (page: Page) =>
  page.addStyleTag({ content: `:root { --bl-duration-base: ${SLOW}ms; }` })
const rising = (xs: number[]) => xs.every((x, i) => i === 0 || x >= xs[i - 1]!)

test('opening animates the body from 0 to its height', async ({ page }) => {
  await page.goto('/')
  const live = await supported(page)
  await slow(page)
  const { frames, top } = await sample(page, 2, SLOW + 600)
  const final = frames[frames.length - 1]!
  expect(final.open).toBe(true)
  expect(final.rendered).toBe(true)
  expect(final.h).toBeGreaterThan(10)
  expect(final.o).toBe(1)
  expect(frames.every((f) => f.top === top)).toBe(true)
  const mid = frames.filter((f) => f.rendered && f.h > 0 && f.h < final.h - 1)
  if (live) {
    expect(mid.length).toBeGreaterThanOrEqual(3)
    expect(mid.every((f) => f.o > 0 && f.o < 1)).toBe(true)
    expect(rising(mid.map((f) => f.h))).toBe(true)
    expect(rising(mid.map((f) => f.o))).toBe(true)
    expect(mid[0]!.h).toBeLessThan(mid[mid.length - 1]!.h)
  } else {
    expect(mid).toHaveLength(0)
  }
})

test('closing keeps the body rendered until the exit ends', async ({ page }) => {
  await page.goto('/')
  const live = await supported(page)
  await slow(page)
  const { wasOpen, frames, top } = await sample(page, 0, SLOW + 600)
  expect(wasOpen).toBe(true)
  expect(frames[0]!.open).toBe(false)
  expect(frames[frames.length - 1]!.rendered).toBe(false)
  expect(frames.every((f) => f.top === top)).toBe(true)
  const mid = frames.filter((f) => !f.open && f.rendered && f.o > 0 && f.o < 1 && f.h > 0)
  if (live) {
    expect(mid.length).toBeGreaterThanOrEqual(3)
    expect(mid.every((f) => f.o > 0 && f.o < 1)).toBe(true)
    expect(rising(mid.map((f) => f.h).reverse())).toBe(true)
    expect(rising(mid.map((f) => f.o).reverse())).toBe(true)
    expect(mid[0]!.h).toBeGreaterThan(mid[mid.length - 1]!.h)
  } else {
    expect(mid).toHaveLength(0)
  }
})

test('a named group still closes the sibling', async ({ page }) => {
  await page.goto('/')
  const [a, b] = [
    page.locator('[data-demo="disclosure"] details').nth(0),
    page.locator('[data-demo="disclosure"] details').nth(1)
  ]
  await expect(a).toHaveAttribute('open', '')
  await b.locator('summary').click()
  await expect(b).toHaveAttribute('open', '')
  await expect(a).not.toHaveAttribute('open', '')
  await expect(page.locator('[data-demo="faq-state"]')).toHaveText('false/true')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('opens and closes instantly', async ({ page }) => {
    await page.goto('/')
    const opened = await sample(page, 2)
    const final = opened.frames[opened.frames.length - 1]!
    expect(final.rendered).toBe(true)
    // Every frame after the click is already at rest: full height, full opacity.
    for (const f of opened.frames) {
      expect(f.o).toBe(1)
      expect(f.h).toBe(final.h)
    }
    const closed = await sample(page, 2)
    expect(closed.frames.filter((f) => f.rendered)).toHaveLength(0)
  })
})
