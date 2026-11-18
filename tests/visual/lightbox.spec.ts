import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Classic scrollbars, so opening can be checked for a page shift.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

const thumbs = (page: Page) => page.locator('[data-demo="lightbox"] .pg-thumb')
const viewer = (page: Page) => page.getByRole('dialog', { name: 'Image viewer' })
// The playground has two lightboxes; only the open one counts.
const shown = (page: Page, part: string) => page.locator(`.bl-lightbox[open] ${part}`)
const count = (page: Page) => shown(page, '.bl-lightbox__count')

async function open(page: Page, at = 0) {
  await page.goto('/')
  await thumbs(page).nth(at).click()
  await expect(viewer(page)).toBeVisible()
  await expect(shown(page, '.bl-lightbox__media')).toHaveAttribute('data-loaded', 'true')
}

test('open lightbox', async ({ page }) => {
  await open(page)
  await page.evaluate(() => document.fonts.ready)
  await expect(page).toHaveScreenshot('lightbox-open.png')
})

test('arrow keys and buttons move through the group and the counter follows', async ({ page }) => {
  await open(page)
  await expect(count(page)).toHaveText('1 / 4')
  await expect(viewer(page)).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(count(page)).toHaveText('2 / 4')
  await expect(shown(page, '[aria-live="polite"]')).toHaveText('Image 2 of 4')
  await page.keyboard.press('End')
  await expect(count(page)).toHaveText('4 / 4')
  await expect(page.getByRole('button', { name: 'Next image' })).toBeDisabled()
  await page.getByRole('button', { name: 'Previous image' }).click()
  await expect(count(page)).toHaveText('3 / 4')
  await page.keyboard.press('Home')
  await expect(count(page)).toHaveText('1 / 4')
  // focus stays usable at an end: never dropped to <body>
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(viewer(page)).toBeHidden()
  await expect(thumbs(page).first()).toBeFocused()
  await expect(page.locator('[data-demo="lightbox"]')).toContainText('Last close: escape')
})

test.describe('touch', () => {
  test.use({ hasTouch: true })

  test('swipe moves to the next image', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'touch is a mobile concern')
    await open(page)
    const box = (await shown(page, '.bl-lightbox__stage').boundingBox())!
    const y = box.y + box.height / 2
    const cdp = await page.context().newCDPSession(page)
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x?: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: x === undefined ? [] : [{ x, y }]
      })
    await touch('touchStart', box.x + box.width * 0.8)
    for (let step = 1; step <= 6; step++)
      await touch('touchMove', box.x + box.width * (0.8 - step * 0.1))
    await touch('touchEnd')
    await expect(count(page)).toHaveText('2 / 4')
    await expect(viewer(page)).toBeVisible()
  })
})

test('under rtl ArrowRight goes back and the previous button is on the right', async ({ page }) => {
  await open(page, 1)
  await page.evaluate(() => (document.documentElement.dir = 'rtl'))
  const prev = (await page.getByRole('button', { name: 'Previous image' }).boundingBox())!
  const next = (await page.getByRole('button', { name: 'Next image' }).boundingBox())!
  expect(prev.x).toBeGreaterThan(next.x)
  await page.keyboard.press('ArrowRight')
  await expect(count(page)).toHaveText('1 / 4')
  await page.keyboard.press('ArrowLeft')
  await expect(count(page)).toHaveText('2 / 4')
})

test('media and caption stay inside the viewport', async ({ page }) => {
  await open(page)
  for (let i = 0; i < 4; i++) {
    await expect(count(page)).toHaveText(`${i + 1} / 4`)
    await expect(shown(page, '.bl-lightbox__media')).toHaveAttribute('data-loaded', 'true')
    const outside = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          '.bl-lightbox[open] :is(.bl-lightbox__media, .bl-lightbox__caption, .bl-btn)'
        )
      ]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return (
            r.left < -0.5 ||
            r.top < -0.5 ||
            r.right > innerWidth + 0.5 ||
            r.bottom > innerHeight + 0.5
          )
        })
        .map((el) => el.className)
    )
    expect(outside).toEqual([])
    await page.keyboard.press('ArrowRight')
  }
})

test('opening does not shift the page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
  await page.goto('/')
  const gutter = await page.evaluate(() => innerWidth - document.documentElement.clientWidth)
  expect(gutter, 'a classic scrollbar is present').toBeGreaterThan(0)
  const demo = page.locator('[data-demo="lightbox"]')
  const x = () => demo.evaluate((el) => el.getBoundingClientRect().left)
  const before = await x()
  await thumbs(page).first().click()
  await expect(page.locator('.bl-lightbox[open]')).toBeVisible()
  expect(await x()).toBeCloseTo(before, 0)
})

test('no axe violations with the lightbox open', async ({ page }) => {
  await open(page)
  const results = await new AxeBuilder({ page }).include('.bl-lightbox[open]').analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

test.describe('forced colors', () => {
  test.use({ forcedColors: 'active' })
  test('the buttons keep a visible edge', async ({ page }) => {
    await open(page)
    const [edge, text] = await shown(page, '.bl-lightbox__nav--next').evaluate((el) => [
      getComputedStyle(el).borderTopColor,
      getComputedStyle(document.body).color
    ])
    expect(edge).toBe(text) // CanvasText
  })
})

const plates = (page: Page) => page.locator('[data-demo="lightbox-plates"] .pg-thumb')
const PLATE_1 = 'Plate 1: amber hills over the river valley, late on a long summer evening'

async function openPlates(page: Page, at = 0) {
  await page.goto('/')
  await plates(page).nth(at).click()
  await expect(shown(page, '.bl-lightbox__stage')).toHaveAttribute('data-loaded', 'true')
}

test('lightbox bar with a title and actions', async ({ page }) => {
  await openPlates(page)
  // Named by its title, which truncates where the bar is short of room; the name keeps it whole.
  await expect(page.getByRole('dialog', { name: PLATE_1 })).toBeVisible()
  await expect(shown(page, '.bl-lightbox__actions').getByRole('link')).toHaveText('Download')
  await page.evaluate(() => document.fonts.ready)
  await expect(page).toHaveScreenshot('lightbox-bar.png')
})

test('a long title ends in an ellipsis instead of crowding the ×', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'the title fits on desktop')
  await openPlates(page)
  const title = shown(page, '.bl-lightbox__title')
  const [scroll, client] = await title.evaluate((el) => [el.scrollWidth, el.clientWidth])
  expect(scroll).toBeGreaterThan(client)
  const t = (await title.boundingBox())!
  const close = (await shown(page, '.bl-lightbox__close').boundingBox())!
  expect(t.x + t.width).toBeLessThanOrEqual(close.x + 0.5)
})

test('a slotted drawing without src shows at once and the bar follows the item', async ({
  page
}) => {
  await openPlates(page, 2)
  await expect(shown(page, 'svg.bl-lightbox__media')).toBeVisible()
  await expect(shown(page, '.bl-lightbox__title')).toHaveText('Plate 3: survey grid')
  await expect(shown(page, '.bl-lightbox__actions')).toHaveCount(0)
  await page.keyboard.press('Home')
  await expect(shown(page, '.bl-lightbox__title')).toHaveText(PLATE_1)
  await expect(shown(page, '[aria-live="polite"]')).toHaveText('Image 1 of 3, Landscape, 3:2.')
})

test('under rtl the title starts on the right and the × sits on the left', async ({ page }) => {
  await openPlates(page)
  await page.evaluate(() => (document.documentElement.dir = 'rtl'))
  const title = (await shown(page, '.bl-lightbox__title').boundingBox())!
  const close = (await shown(page, '.bl-lightbox__close').boundingBox())!
  expect(close.x).toBeLessThan(title.x)
  // Desktop: the actions sit between the title and the ×; mobile: under the title, on its side.
  const actions = (await shown(page, '.bl-lightbox__actions .bl-btn').boundingBox())!
  expect(actions.x + actions.width).toBeLessThanOrEqual(title.x + title.width + 0.5)
})

test('clicks in the bar never close the lightbox', async ({ page }) => {
  await openPlates(page)
  await shown(page, '.bl-lightbox__title').click()
  await page.waitForTimeout(300)
  await expect(shown(page, '.bl-lightbox__stage')).toBeVisible()
})

// Zoom, on the plates demo's inline drawing (2400 x 1600, so 1:1 is well above fit).
const readout = (page: Page) => shown(page, '.bl-lightbox__readout')
const drawing = (page: Page) => shown(page, 'svg.bl-lightbox__media')
const box = async (page: Page, part: string) => (await shown(page, part).boundingBox())!

test('the wheel zooms around the pointer and a drag pans, clamped to the frame', async ({
  page
}) => {
  await openPlates(page, 2)
  const before = (await drawing(page).boundingBox())!
  const [fx, fy] = [0.55, 0.45]
  const [px, py] = [before.x + before.width * fx, before.y + before.height * fy]
  await page.mouse.move(px, py)
  await page.mouse.wheel(0, -200)
  await expect(readout(page)).not.toHaveText('100%')
  await expect
    .poll(async () => (await drawing(page).boundingBox())!.width)
    .toBeGreaterThan(before.width * 1.2)
  const after = (await drawing(page).boundingBox())!
  // the same spot of the drawing is still under the pointer, on each axis where the drawing
  // outgrew the frame (where it did not, it stays centred)
  const frame = await box(page, '.bl-lightbox__frame')
  if (after.width > frame.width) expect(Math.abs(after.x + after.width * fx - px)).toBeLessThan(1.5)
  if (after.height > frame.height)
    expect(Math.abs(after.y + after.height * fy - py)).toBeLessThan(1.5)
  // dragged far right and down, the drawing's top-left corner stops at the frame's
  await page.mouse.down()
  await page.mouse.move(px + 3000, py + 3000, { steps: 6 })
  await page.mouse.up()
  await expect
    .poll(async () => Math.abs((await drawing(page).boundingBox())!.x - frame.x))
    .toBeLessThan(1.5)
  const dragged = (await drawing(page).boundingBox())!
  if (dragged.height > frame.height) expect(Math.abs(dragged.y - frame.y)).toBeLessThan(1.5)
  // the click that ended the drag did not close it
  await expect(shown(page, '.bl-lightbox__stage')).toBeVisible()
})

test('double-click toggles fit and 1:1, and the next item starts at fit', async ({ page }) => {
  await openPlates(page, 2)
  // The svg letterboxes its 3:2 drawing (viewBox, meet) inside its own box.
  const drawn = async () => {
    const b = (await drawing(page).boundingBox())!
    return Math.min(b.width, b.height * 1.5)
  }
  const fit = await drawn()
  const frame = await box(page, '.bl-lightbox__frame')
  const [cx, cy] = [frame.x + frame.width / 2, frame.y + frame.height / 2]
  await page.mouse.dblclick(cx, cy)
  await expect.poll(drawn).toBeCloseTo(2400, -1) // 1:1
  await page.mouse.dblclick(cx, cy)
  await expect(readout(page)).toHaveText('100%')
  await expect.poll(drawn).toBeCloseTo(fit, 0)
  await page.keyboard.press('+')
  await expect(readout(page)).toHaveText('125%')
  await page.keyboard.press('Home') // Home and End navigate while zoomed
  await expect(shown(page, '.bl-lightbox__title')).toHaveText(PLATE_1)
  await expect(readout(page)).toHaveText('100%')
  await expect(shown(page, '.bl-lightbox__frame')).not.toHaveAttribute('style', /scale/)
})

test('lightbox zoomed in with its controls', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-dark', 'three projects are enough')
  await openPlates(page, 2)
  for (let i = 0; i < 4; i++) await page.keyboard.press('+')
  await expect(readout(page)).toHaveText('244%')
  await expect(page.getByRole('button', { name: 'Reset zoom, 244%' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await expect(page).toHaveScreenshot('lightbox-zoomed.png')
})

test.describe('zoom with motion', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('fast zoom-out steps mid-transition still clamp the pan to the frame', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await openPlates(page, 2)
    // once the entry has scaled the stage up to full size, the frame's rect is its layout box
    await expect
      .poll(() => shown(page, '.bl-lightbox__stage').evaluate((el) => getComputedStyle(el).scale))
      .toBe('none')
    const frame = await box(page, '.bl-lightbox__frame')
    for (let i = 0; i < 8; i++) await page.keyboard.press('+')
    await expect(readout(page)).toHaveText('596%')
    await page.waitForTimeout(400) // the eased steps end
    // dragged far right, the drawing's left edge stops at the frame's
    const [x, y] = [frame.x + frame.width / 2, frame.y + frame.height / 2]
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 4000, y, { steps: 40 })
    await page.mouse.up()
    const gap = async () => Math.abs((await drawing(page).boundingBox())!.x - frame.x)
    await expect.poll(gap).toBeLessThan(1.5)
    await page.waitForTimeout(400)
    // three quick steps out, each starting while the last one still eases
    for (let i = 0; i < 3; i++) await page.keyboard.press('-')
    await expect(readout(page)).toHaveText('305%')
    // once the eased steps have finished, the edge is at the frame (one sample, not a poll that
    // could catch it passing by mid-transition)
    await shown(page, '.bl-lightbox__frame').evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished))
    )
    expect(await gap()).toBeLessThan(1.5)
  })
})

test.describe('touch zoom', () => {
  test.use({ hasTouch: true })

  test('a long caption on a zoomable stage still scrolls by touch', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'touch is a mobile concern')
    await page.goto('/stress.html?case=lightbox-bar')
    await page.locator('[data-box] .bl-btn').click()
    const caption = page.locator('.bl-lightbox[open] .bl-lightbox__caption')
    await expect(caption).toBeVisible()
    expect(await caption.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
    const b = (await caption.boundingBox())!
    const cdp = await page.context().newCDPSession(page)
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y?: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: y === undefined ? [] : [{ x: b.x + b.width / 2, y }]
      })
    await touch('touchStart', b.y + b.height - 5)
    for (let step = 1; step <= 6; step++) await touch('touchMove', b.y + b.height - 5 - step * 12)
    await touch('touchEnd')
    await expect.poll(() => caption.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  })

  test('two fingers pinch the drawing in, and the stage blocks page zoom', async ({
    page
  }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'touch is a mobile concern')
    await openPlates(page, 2)
    const stage = shown(page, '.bl-lightbox__stage')
    expect(await stage.evaluate((el) => getComputedStyle(el).touchAction)).toBe('none')
    const b = (await drawing(page).boundingBox())!
    const [cx, cy] = [b.x + b.width / 2, b.y + b.height / 2]
    const cdp = await page.context().newCDPSession(page)
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', spread?: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints:
          spread === undefined
            ? []
            : [
                { x: cx - spread, y: cy, id: 1 },
                { x: cx + spread, y: cy, id: 2 }
              ]
      })
    await touch('touchStart', 20)
    for (let s = 30; s <= 80; s += 10) await touch('touchMove', s)
    await touch('touchEnd')
    await expect(readout(page)).toHaveText('400%')
    // a pinch is not a swipe or a close
    await expect(shown(page, '.bl-lightbox__title')).toHaveText('Plate 3: survey grid')
    expect(await page.evaluate(() => visualViewport?.scale ?? 1)).toBe(1)
  })
})
