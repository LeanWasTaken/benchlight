import { expect, test } from '@playwright/test'

const demo = (page: import('@playwright/test').Page, name: string) =>
  page.locator(`[data-demo="${name}"]`)
const opener = (page: import('@playwright/test').Page) =>
  demo(page, 'dialog').getByRole('button', { name: 'Rename' })

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

test.describe('BlDisclosure', () => {
  test('opening one in a named group closes its sibling', async ({ page }) => {
    await page.goto('/')
    const [a, b] = [
      demo(page, 'disclosure').locator('details').nth(0),
      demo(page, 'disclosure').locator('details').nth(1)
    ]
    await expect(a).toHaveAttribute('open', '')
    await b.locator('summary').click()
    await expect(b).toHaveAttribute('open', '')
    await expect(a).not.toHaveAttribute('open', '')
    // Both v-models followed the browser, including the sibling it closed.
    await expect(page.locator('[data-demo="faq-state"]')).toHaveText('false/true')
  })
})

test.describe('BlDialog', () => {
  test('Esc closes and focus returns to the opener', async ({ page }) => {
    await page.goto('/')
    await opener(page).click()
    const dialog = page.getByRole('dialog', { name: 'Rename item' })
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener(page)).toBeFocused()
  })

  test('a backdrop click closes; a drag from the panel to the backdrop does not', async ({
    page
  }) => {
    await page.goto('/')
    await opener(page).click()
    const dialog = page.getByRole('dialog', { name: 'Rename item' })
    const box = (await page.locator('.bl-dialog[open] .bl-dialog__panel').boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(5, 5)
    await page.mouse.up()
    await expect(dialog).toBeVisible()
    await page.mouse.click(5, 5)
    await expect(dialog).toBeHidden()
  })

  test('the page behind is inert and does not scroll', async ({ page }) => {
    await page.goto('/')
    await opener(page).click()
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflowY))
      .toBe('hidden')
    // Sample once the open has settled: the playground re-render re-measures the narrow
    // BlTable, and under reduced motion its 0.01ms transitions briefly lengthen the page.
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)))
    const before = await page.evaluate(() => scrollY)
    await page.mouse.wheel(0, 800)
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => scrollY)).toBe(before)
    const link = page.locator('.bl-site-bar a').first()
    expect(await link.evaluate((el) => (el.focus(), document.activeElement === el))).toBe(false)
  })

  test('dismissible=false survives two Esc presses', async ({ page }) => {
    await page.goto('/')
    await demo(page, 'dialog').getByRole('button', { name: 'Delete project' }).click()
    const dialog = page.getByRole('dialog', { name: 'Delete project?' })
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Keep' }).click()
    await expect(dialog).toBeHidden()
  })

  test('is a bottom sheet below 40em', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'phone width only')
    await page.goto('/')
    await opener(page).click()
    const r = (await page.locator('.bl-dialog[open]').boundingBox())!
    const vp = page.viewportSize()!
    expect(Math.round(r.width)).toBe(vp.width)
    expect(Math.round(r.y + r.height)).toBe(vp.height)
  })
})
