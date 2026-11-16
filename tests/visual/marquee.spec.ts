import { expect, test, type Page } from '@playwright/test'

// The stress page has the 12rem marquee; motion must be on for the text to scroll.
test.use({ reducedMotion: 'no-preference' })

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
  await page.goto('/stress.html?case=marquee-glide')
  await expect(page.locator('.bl-marquee__toggle')).toHaveCount(1)
})

const playState = (page: Page) =>
  page.evaluate(
    () => document.querySelector('.bl-marquee__content')!.getAnimations()[0]?.playState ?? 'none'
  )

test('the toggle is a native button that pauses on click, Enter and Space', async ({ page }) => {
  const toggle = page.locator('.bl-marquee__toggle')
  await expect(page.locator('.bl-marquee')).not.toHaveAttribute('role', /.*/)
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  expect(await playState(page)).toBe('running')

  await toggle.click()
  // Move the pointer off so only the toggle can be holding the scroll.
  await page.mouse.move(0, 0)
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  expect(await playState(page)).toBe('paused')

  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  expect(await playState(page)).toBe('running')

  await page.keyboard.press('Space')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  expect(await playState(page)).toBe('paused')
  await page.keyboard.press('Space')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  expect(await playState(page)).toBe('running')
})

test('focus on a link inside pauses the scroll and keeps the link in view, blur resumes', async ({
  page
}) => {
  await page.evaluate(() => {
    document.querySelector('.bl-marquee__content span')!.innerHTML =
      'Some long leading text that pushes things well beyond the box width ' +
      '<a href="#x" id="lk">the link target</a> trailing words go on and on and on'
  })
  await expect.poll(() => playState(page)).toBe('running')

  await page.focus('#lk')
  expect(await playState(page)).toBe('paused')
  const inside = await page.evaluate(() => {
    const view = document.querySelector('.bl-marquee__viewport')!.getBoundingClientRect()
    const link = document.getElementById('lk')!.getBoundingClientRect()
    return link.left >= view.left - 1 && link.right <= view.right + 1
  })
  expect(inside).toBe(true)

  await page.evaluate(() => (document.activeElement as HTMLElement).blur())
  expect(await playState(page)).toBe('running')
  expect(await page.locator('.bl-marquee__viewport').evaluate((el) => el.scrollLeft)).toBe(0)
})
