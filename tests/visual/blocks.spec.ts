import { expect, test } from '@playwright/test'

const demo = (page: import('@playwright/test').Page, name: string) =>
  page.locator(`[data-demo="${name}"]`)

test.describe('BlToggle', () => {
  test('Space toggles the switch', async ({ page }) => {
    await page.goto('/')
    const input = demo(page, 'toggle').getByRole('switch', { name: 'Wi-Fi' })
    await expect(input).toBeChecked()
    await input.focus()
    await page.keyboard.press('Space')
    await expect(input).not.toBeChecked()
  })

  test('a native Reset restores the initial state and the v-model follows', async ({ page }) => {
    await page.goto('/')
    const form = demo(page, 'toggle-reset')
    const input = form.getByRole('switch', { name: 'Auto-join' })
    const state = demo(page, 'toggle-state')
    await expect(input).toBeChecked()
    await input.focus()
    await page.keyboard.press('Space')
    await expect(input).not.toBeChecked()
    await expect(state).toHaveText('false')
    await form.getByRole('button', { name: 'Reset' }).click()
    await expect(input).toBeChecked()
    await expect(state).toHaveText('true')
  })

  test.describe('forced colors', () => {
    test.use({ forcedColors: 'active' })
    test('checked and unchecked tracks stay distinguishable', async ({ page }) => {
      await page.goto('/')
      const tracks = demo(page, 'toggle').locator('.bl-toggle__track')
      const on = await tracks.nth(0).evaluate((el) => getComputedStyle(el).backgroundColor)
      const off = await tracks.nth(1).evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(on).not.toBe(off)
    })
    test('a disabled switch reads as disabled, on or off', async ({ page }) => {
      await page.goto('/')
      const toggles = demo(page, 'toggle').locator('.bl-toggle')
      const [enabled, disabled] = [toggles.nth(0), toggles.nth(1)]
      const color = (t: import('@playwright/test').Locator) =>
        t.locator('.bl-toggle__label').evaluate((el) => getComputedStyle(el).color)
      expect(await color(disabled)).not.toBe(await color(enabled))
      await disabled.locator('input').evaluate((el: HTMLInputElement) => (el.checked = true))
      const [track, ground] = await disabled
        .locator('.bl-toggle__track')
        .evaluate((el) => [
          getComputedStyle(el).backgroundColor,
          getComputedStyle(document.body).backgroundColor
        ])
      expect(track, 'no Highlight fill on a disabled, checked track').toBe(ground)
    })
  })
})
