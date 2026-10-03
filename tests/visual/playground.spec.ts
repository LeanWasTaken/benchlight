import { expect, test } from '@playwright/test'

test('playground renders every component', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  // Linux Chromium rounds a fractional page height up or down between captures, so clip the
  // full-page shot to a whole-pixel box.
  const { width, height } = await page.evaluate(() => {
    const box = document.documentElement.getBoundingClientRect()
    return { width: Math.floor(box.width), height: Math.floor(box.height) }
  })
  await expect(page).toHaveScreenshot('playground.png', {
    fullPage: true,
    clip: { x: 0, y: 0, width, height }
  })
})

test('a saved choice opposite to the OS survives a reload', async ({ page }, testInfo) => {
  const opposite = testInfo.project.name.endsWith('dark') ? 'Light' : 'Dark'
  await page.goto('/')
  await page.getByRole('radio', { name: opposite }).check({ force: true })
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-bl-appearance', opposite.toLowerCase())
  // Block the app bundle so only the inline prepaint script can apply the choice.
  await page.route(/\/assets\/.*\.js$/, (route) => route.abort())
  await page.reload()
  await expect(html).toHaveAttribute('data-bl-appearance', opposite.toLowerCase())
  const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(canvas).toBe(opposite === 'Dark' ? 'rgb(16, 18, 20)' : 'rgb(239, 241, 243)')
})

test('the tab bar is pinned to the viewport bottom on mobile and hidden on desktop', async ({
  page
}, testInfo) => {
  await page.goto('/')
  const tabbar = page.locator('.bl-tabbar')
  if (testInfo.project.name.startsWith('mobile')) {
    await expect(tabbar).toBeVisible()
    const box = await tabbar.boundingBox()
    const height = page.viewportSize()?.height ?? 0
    expect(box).not.toBeNull()
    expect(height - (box!.y + box!.height)).toBeLessThan(16)
    expect(height - (box!.y + box!.height)).toBeGreaterThanOrEqual(-1)
  } else {
    await expect(tabbar).not.toBeVisible()
  }
})
