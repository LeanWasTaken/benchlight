import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Classic scrollbars, so opening can be checked for a page shift.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

const thumbs = (page: Page) => page.locator('[data-demo="lightbox"] .pg-thumb')
const viewer = (page: Page) => page.getByRole('dialog', { name: 'Image viewer' })
const count = (page: Page) => page.locator('.bl-lightbox__count')

async function open(page: Page, at = 0) {
  await page.goto('/')
  await thumbs(page).nth(at).click()
  await expect(viewer(page)).toBeVisible()
  await expect(page.locator('.bl-lightbox__media')).toHaveAttribute('data-loaded', 'true')
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
  await expect(page.locator('.bl-lightbox [aria-live="polite"]')).toHaveText('Image 2 of 4')
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
    const box = (await page.locator('.bl-lightbox__stage').boundingBox())!
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
    await expect(page.locator('.bl-lightbox__media')).toHaveAttribute('data-loaded', 'true')
    const outside = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          '.bl-lightbox__media, .bl-lightbox__caption, .bl-lightbox .bl-btn'
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
    const [edge, text] = await page
      .locator('.bl-lightbox__nav--next')
      .evaluate((el) => [
        getComputedStyle(el).borderTopColor,
        getComputedStyle(document.body).color
      ])
    expect(edge).toBe(text) // CanvasText
  })
})
