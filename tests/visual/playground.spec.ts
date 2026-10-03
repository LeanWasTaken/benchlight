import { expect, test } from '@playwright/test'

test('playground renders every component', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page).toHaveScreenshot('playground.png', { fullPage: true })
})

test('a saved choice opposite to the OS survives a reload', async ({ page }, testInfo) => {
  const opposite = testInfo.project.name.endsWith('dark') ? 'Light' : 'Dark'
  await page.goto('/')
  await page.getByRole('radio', { name: opposite }).check({ force: true })
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-kd-appearance', opposite.toLowerCase())
  await page.reload()
  await expect(html).toHaveAttribute('data-kd-appearance', opposite.toLowerCase())
  const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(canvas).toBe(opposite === 'Dark' ? 'rgb(16, 18, 20)' : 'rgb(239, 241, 243)')
})
