import { expect, test, type Locator, type Page } from '@playwright/test'

// anchored.css: var(--bl-anchored-gap, 6px), unset in the playground.
const GAP = 6
const DELAY = 400
const demo = (page: Page) => page.locator('[data-demo="tooltip"]')
const trigger = (page: Page, name: string) => demo(page).getByRole('button', { name, exact: true })
const tipOf = async (t: Locator) =>
  t.page().locator(`[id="${await t.getAttribute('aria-describedby')}"]`)
const box = (l: Locator) =>
  l.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return {
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2
    }
  })
const isOpen = (l: Locator) => l.evaluate((el) => el.matches(':popover-open'))

// Samples a popover (or an open <dialog>) every frame for `ms` and reports whether it stayed open
// the whole time: an observation window that fails on the first closed frame, not a blind sleep.
const staysOpenFor = (l: Locator, ms: number) =>
  l.evaluate(
    (el, ms) =>
      new Promise<boolean>((resolve) => {
        const end = performance.now() + ms
        const tick = () => {
          if (!el.matches(':popover-open, dialog[open]')) resolve(false)
          else if (performance.now() >= end) resolve(true)
          else requestAnimationFrame(tick)
        }
        tick()
      }),
    ms
  )

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  // Centre the row in the viewport so a top tooltip has room above it (no flip) and a phone
  // viewport has room on both sides of the centred tooltip.
  await page.addStyleTag({ content: '.bl-tab-bar { display: none !important; }' })
  await demo(page).evaluate((el) => {
    el.style.justifyContent = 'center'
    el.scrollIntoView({ block: 'center' })
  })
})

test('the trigger is described by the tooltip text', async ({ page }) => {
  const t = trigger(page, 'Copy hash')
  const tip = await tipOf(t)
  await expect(tip).toHaveAttribute('role', 'tooltip')
  await expect(t).toHaveAccessibleDescription('Copies the build hash to the clipboard.')
})

test('hover shows it after the delay, above and centred', async ({ page }) => {
  await trigger(page, 'Schedule').evaluate((el) => (el.style.display = 'none'))
  const t = trigger(page, 'Copy hash')
  const tip = await tipOf(t)
  const a = await box(t)
  await page.mouse.move(a.cx, a.cy)
  const hoveredAt = Date.now()
  await expect(tip).toBeVisible()
  // Measured from the hover itself, so a slow machine only makes the gap larger.
  expect(Date.now() - hoveredAt).toBeGreaterThanOrEqual(DELAY - 50)
  const p = await box(tip)
  expect(a.top - p.bottom).toBeCloseTo(GAP, 0)
  expect(Math.abs(p.cx - a.cx)).toBeLessThanOrEqual(1)
})

test('the pointer can cross onto the tooltip without it closing', async ({ page }) => {
  await trigger(page, 'Schedule').evaluate((el) => (el.style.display = 'none'))
  const t = trigger(page, 'Copy hash')
  const tip = await tipOf(t)
  const a = await box(t)
  await page.mouse.move(a.cx, a.cy)
  await expect(tip).toBeVisible()
  const p = await box(tip)
  // Up through the 6px gap (on neither element) and into the tooltip.
  await page.mouse.move(a.cx, p.bottom - 4, { steps: 4 })
  expect(await staysOpenFor(tip, 400)).toBe(true)
  // Leaving the tooltip for empty space hides it after the grace.
  await page.mouse.move(a.cx, p.top - 60, { steps: 2 })
  await expect.poll(() => isOpen(tip), { timeout: 2000 }).toBe(false)
  await expect(tip).toBeHidden()
})

test('keyboard focus shows it at once; Esc hides it and the trigger keeps focus', async ({
  page,
  browserName
}) => {
  test.fixme(
    browserName === 'webkit' && process.platform === 'darwin',
    'macOS WebKit does not Tab-focus buttons (system default); passes on Linux CI'
  )
  const t = trigger(page, 'Copy hash')
  const tip = await tipOf(t)
  // Reach the trigger by Tab so it matches :focus-visible.
  await page.locator('[data-demo="popover"]').getByRole('button', { name: 'Filters' }).focus()
  await page.keyboard.press('Tab')
  await expect(t).toBeFocused()
  // No pointer is over it, so this is the focus path, not the hover delay.
  await expect.poll(() => isOpen(tip), { timeout: DELAY - 100 }).toBe(true)
  await page.keyboard.press('Escape')
  await expect.poll(() => isOpen(tip), { timeout: 2000 }).toBe(false)
  await expect(t).toBeFocused()
})

test('blur hides it', async ({ page, browserName }) => {
  test.fixme(
    browserName === 'webkit' && process.platform === 'darwin',
    'macOS WebKit does not Tab-focus buttons (system default); passes on Linux CI'
  )
  const t = trigger(page, 'Copy hash')
  const tip = await tipOf(t)
  await page.locator('[data-demo="popover"]').getByRole('button', { name: 'Filters' }).focus()
  await page.keyboard.press('Tab')
  await expect.poll(() => isOpen(tip)).toBe(true)
  await page.keyboard.press('Tab')
  await expect(t).not.toBeFocused()
  await expect.poll(() => isOpen(tip), { timeout: 2000 }).toBe(false)
})

test('a mouse click focus does not show it before the hover delay', async ({
  page,
  browserName
}) => {
  test.fixme(
    browserName === 'webkit' && process.platform === 'darwin',
    'macOS WebKit does not Tab-focus buttons (system default); passes on Linux CI'
  )
  const t = trigger(page, 'Copy hash')
  const tip = await tipOf(t)
  const a = await box(t)
  await page.mouse.click(a.cx, a.cy)
  await expect(t).toBeFocused()
  expect(await isOpen(tip)).toBe(false)
})

test('side=bottom align=start sits below, on the start edge', async ({ page }) => {
  await trigger(page, 'Copy hash').evaluate((el) => (el.style.display = 'none'))
  const t = trigger(page, 'Schedule')
  const tip = await tipOf(t)
  const a = await box(t)
  await page.mouse.move(a.cx, a.cy)
  await expect(tip).toBeVisible()
  const p = await box(tip)
  expect(p.top - a.bottom).toBeCloseTo(GAP, 0)
  expect(Math.abs(p.left - a.left)).toBeLessThanOrEqual(1)
})

// The tooltip's Esc calls preventDefault, so the browser's close request does not also reach the
// enclosing dialog or auto popover: the first Esc hides only the tooltip, the second closes the
// container.
test.describe('Esc inside a container', () => {
  test('in an open dialog, the first Esc hides the tooltip and the dialog stays open', async ({
    page,
    browserName
  }) => {
    test.fixme(
      browserName === 'webkit' && process.platform === 'darwin',
      'macOS WebKit does not Tab-focus buttons (system default); passes on Linux CI'
    )
    await page.locator('[data-demo="dialog"]').getByRole('button', { name: 'Rename' }).click()
    const dialog = page.getByRole('dialog', { name: 'Rename item' })
    await expect(dialog).toBeVisible()
    const t = dialog.getByRole('button', { name: 'Copy name' })
    const tip = await tipOf(t)
    // Reach the trigger by Tab from the field so it matches :focus-visible.
    await dialog.getByRole('textbox', { name: 'Name' }).focus()
    await page.keyboard.press('Tab')
    await expect(t).toBeFocused()
    await expect.poll(() => isOpen(tip)).toBe(true)
    await page.keyboard.press('Escape')
    await expect.poll(() => isOpen(tip), { timeout: 2000 }).toBe(false)
    expect(await staysOpenFor(dialog, 400)).toBe(true)
    await expect(t).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('in an open popover, the first Esc hides the tooltip and the popover stays open', async ({
    page,
    browserName
  }) => {
    test.fixme(
      browserName === 'webkit' && process.platform === 'darwin',
      'macOS WebKit does not Tab-focus buttons (system default); passes on Linux CI'
    )
    const filters = page.locator('[data-demo="popover"]').getByRole('button', { name: 'Filters' })
    const panel = page.locator(`[id="${await filters.getAttribute('aria-controls')}"]`)
    await filters.click()
    await expect(panel).toBeVisible()
    const t = panel.getByRole('button', { name: 'Clear filters' })
    const tip = await tipOf(t)
    await page.keyboard.press('Tab')
    await expect(t).toBeFocused()
    await expect.poll(() => isOpen(tip)).toBe(true)
    await page.keyboard.press('Escape')
    await expect.poll(() => isOpen(tip), { timeout: 2000 }).toBe(false)
    expect(await staysOpenFor(panel, 400)).toBe(true)
    await expect(t).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(filters).toHaveAttribute('aria-expanded', 'false')
  })
})
