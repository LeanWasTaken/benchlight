import { expect, test, type Page } from '@playwright/test'

// Behaviour checks that also run in Firefox and WebKit (playwright.config.ts), where the
// fallbacks for Chromium-only features (the `closedby` attribute, focus loss on removal) are
// the code path under test. Popover, tooltip, tabs and number-field behaviour live in their own
// specs, which those projects run too.

const demo = (page: Page, name: string) => page.locator(`[data-demo="${name}"]`)

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('a dismissible dialog closes on Esc', async ({ page }) => {
  await demo(page, 'dialog').getByRole('button', { name: 'Rename' }).click()
  const dialog = page.getByRole('dialog', { name: 'Rename item' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(demo(page, 'dialog')).toContainText('Last close: escape')
})

test('a non-dismissible dialog stays open on Esc and closes from its footer', async ({ page }) => {
  await demo(page, 'dialog').getByRole('button', { name: 'Delete project' }).click()
  const dialog = page.getByRole('dialog', { name: 'Delete project?' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  // A short window rather than one sample: a close, if any, lands asynchronously.
  await page.waitForTimeout(300)
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Keep' }).click()
  await expect(dialog).toBeHidden()
})

test('the lightbox advances on ArrowRight and closes on Esc', async ({ page }) => {
  await demo(page, 'lightbox').locator('.pg-thumb').first().click()
  const viewer = page.getByRole('dialog', { name: 'Image viewer' })
  await expect(viewer).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(viewer.locator('.bl-lightbox__count')).toHaveText('2 / 4')
  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()
  await expect(demo(page, 'lightbox')).toContainText('Last close: escape')
})

test('focus is not lost to <body> when a focused toast goes away', async ({ page }) => {
  const opener = demo(page, 'toast').getByRole('button', { name: 'Persistent', exact: true })
  await opener.focus()
  await page.keyboard.press('Enter')
  const toast = page.locator('.bl-toast', { hasText: 'Syncing' })
  await expect(toast).toBeVisible()
  await toast.locator('.bl-toast__dismiss').focus()
  await page.keyboard.press('Enter')
  await expect(toast).toHaveCount(0)
  await expect(opener).toBeFocused()
})
