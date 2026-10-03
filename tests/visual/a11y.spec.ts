import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('the playground has no axe violations', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

test('the log is keyboard-reachable and scrollable', async ({ page }) => {
  await page.goto('/')
  const log = page.locator('pre.bl-log')
  // Chromium makes overflowing scrollers focusable on its own, so assert the
  // explicit tab stop too, which keeps non-scrolling and older engines covered.
  await expect(log).toHaveAttribute('tabindex', '0')
  await log.focus()
  await expect(log).toBeFocused()
  await page.keyboard.press('End')
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  await page.keyboard.press('Home')
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBe(0)
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
})

test('the skip-link target takes focus without a ring', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  const main = page.locator('main#main-content')
  await expect(main).toBeFocused()
  expect(await main.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none')
})

test('a focused control is not hidden under the mobile tab bar', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'tab bar is mobile-only')
  await page.goto('/')
  const select = page.locator('select.bl-select')
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab')
    if (await select.evaluate((el) => el === document.activeElement)) break
  }
  await expect(select).toBeFocused()
  const field = await select.boundingBox()
  const bar = await page.locator('.bl-tabbar').boundingBox()
  expect(field).not.toBeNull()
  expect(bar).not.toBeNull()
  expect(field!.y + field!.height).toBeLessThanOrEqual(bar!.y)
})

test('the log stays put while scrolled up and follows while pinned', async ({ page }) => {
  await page.goto('/')
  const log = page.locator('pre.bl-log')
  const append = page.getByRole('button', { name: 'Append line' })
  const lineCount = () => log.evaluate((el) => el.textContent?.split('\n').length ?? 0)
  const distanceFromBottom = () =>
    log.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight)

  await log.focus()
  // scroll down first: a scroll event is what unpins the log, and Home alone
  // from the initial top position fires none
  await page.keyboard.press('End')
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  await page.keyboard.press('Home')
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBe(0)
  const before = await lineCount()
  await append.click()
  await expect.poll(lineCount).toBeGreaterThan(before)
  expect(await log.evaluate((el) => el.scrollTop)).toBe(0)

  await log.focus()
  await page.keyboard.press('End')
  await expect.poll(distanceFromBottom).toBeLessThanOrEqual(4)
  const pinnedCount = await lineCount()
  await append.click()
  await expect.poll(lineCount).toBeGreaterThan(pinnedCount)
  await expect.poll(distanceFromBottom).toBeLessThanOrEqual(4)
})
