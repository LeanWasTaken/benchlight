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
