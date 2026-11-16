import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const demo = (page: Page) => page.locator('[data-demo="tabs"]')
const tab = (page: Page, name: string) => demo(page).getByRole('tab', { name, exact: true })
const panel = (page: Page, name: string) => demo(page).getByRole('tabpanel', { name, exact: true })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await demo(page).scrollIntoViewIfNeeded()
})

test('the tabs, panels and their names come from the markup', async ({ page }) => {
  await expect(demo(page).getByRole('tablist', { name: 'Device' })).toBeVisible()
  await expect(demo(page).getByRole('tab')).toHaveCount(4)
  await expect(tab(page, 'Status')).toHaveAttribute('aria-selected', 'true')
  await expect(panel(page, 'Status')).toBeVisible()
  await expect(demo(page).getByRole('tabpanel')).toHaveCount(1)
  await expect(tab(page, 'Radio')).toBeDisabled()
})

test('arrow keys move focus and select in auto mode, skipping the disabled tab', async ({
  page
}) => {
  await tab(page, 'Status').focus()
  await page.keyboard.press('ArrowRight')
  await expect(tab(page, 'Boot log')).toBeFocused()
  await expect(tab(page, 'Boot log')).toHaveAttribute('aria-selected', 'true')
  await expect(panel(page, 'Boot log')).toBeVisible()
  await expect(panel(page, 'Status')).toBeHidden()
  await page.keyboard.press('ArrowRight')
  await expect(tab(page, 'Settings')).toBeFocused()
  await expect(tab(page, 'Settings')).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowRight')
  await expect(tab(page, 'Status')).toBeFocused()
  await page.keyboard.press('End')
  await expect(tab(page, 'Settings')).toBeFocused()
  await page.keyboard.press('Home')
  await expect(tab(page, 'Status')).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(tab(page, 'Settings')).toBeFocused()
  await expect(panel(page, 'Settings')).toBeVisible()
})

test('the arrows swap under dir="rtl"', async ({ page }) => {
  await demo(page).evaluate((el) => el.setAttribute('dir', 'rtl'))
  await tab(page, 'Status').focus()
  await page.keyboard.press('ArrowLeft')
  await expect(tab(page, 'Boot log')).toBeFocused()
  await expect(tab(page, 'Boot log')).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowRight')
  await expect(tab(page, 'Status')).toBeFocused()
  // The tabs run right to left.
  const [status, boot] = await Promise.all(
    ['Status', 'Boot log'].map((n) => tab(page, n).evaluate((el) => el.getBoundingClientRect().x))
  )
  expect(status!).toBeGreaterThan(boot!)
})

test('Tab moves from the tablist into the panel', async ({ page, browserName }) => {
  test.fixme(
    browserName === 'webkit' && process.platform === 'darwin',
    'macOS WebKit does not Tab-focus buttons (system default); passes on Linux CI'
  )
  // A panel of plain text takes focus itself.
  await tab(page, 'Status').focus()
  await page.keyboard.press('Tab')
  await expect(panel(page, 'Status')).toBeFocused()
  // A panel with a control passes focus to the control instead.
  await page.keyboard.press('Shift+Tab')
  await expect(tab(page, 'Status')).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Tab')
  await expect(panel(page, 'Boot log').getByRole('button', { name: 'Download log' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(tab(page, 'Boot log')).toBeFocused()
})

test('a click selects; the focused tab shows a visible ring', async ({ page }) => {
  await tab(page, 'Settings').click()
  await expect(tab(page, 'Settings')).toHaveAttribute('aria-selected', 'true')
  await expect(panel(page, 'Settings')).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  const outline = await tab(page, 'Boot log').evaluate((el) => {
    const s = getComputedStyle(el)
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
  })
  expect(outline.style).toBe('solid')
  expect(outline.width).toBeGreaterThanOrEqual(2)
})

test('the selected tab carries a bar the others lack, also in forced colors', async ({ page }) => {
  const bar = (name: string) =>
    tab(page, name).evaluate((el) => getComputedStyle(el, '::after').backgroundColor)
  expect(await bar('Status')).not.toBe(await bar('Settings'))
  await page.emulateMedia({ forcedColors: 'active' })
  expect(await bar('Status')).not.toBe(await bar('Settings'))
  // Unselected bars stay fully transparent: forced colors keeps the alpha of a background.
  expect(await bar('Settings')).toMatch(/^rgba\(.*, 0\)$/)
})

test('the tabs demo has no axe violations', async ({ page }) => {
  const scan = () =>
    new AxeBuilder({ page })
      .include('[data-demo="tabs"]')
      .analyze()
      .then((r) => r.violations.map((v) => `${v.id}: ${v.nodes.length}`))
  expect(await scan()).toEqual([])
  await tab(page, 'Boot log').click()
  expect(await scan()).toEqual([])
})
