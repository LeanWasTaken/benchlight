import { expect, test, type Locator, type Page } from '@playwright/test'

// anchored.css: var(--bl-anchored-gap, 6px), unset in the playground.
const GAP = 6
const demo = (page: Page) => page.locator('[data-demo="popover"]')
const trigger = (page: Page, name: string) => demo(page).getByRole('button', { name, exact: true })
const panelOf = async (t: Locator) =>
  t.page().locator(`[id="${await t.getAttribute('aria-controls')}"]`)
const box = (l: Locator) =>
  l.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, cx: r.left + r.width / 2 }
  })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('a click opens it, Esc closes it and returns focus to the trigger', async ({
  page,
  browserName
}) => {
  test.fixme(
    browserName === 'webkit' && process.platform === 'darwin',
    'macOS WebKit does not Tab-focus buttons (system default); passes on Linux CI'
  )
  const t = trigger(page, 'Filters')
  const panel = await panelOf(t)
  await t.click()
  await expect(panel).toBeVisible()
  await expect(t).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Tab')
  await expect(panel.getByRole('button', { name: 'Clear filters' })).toBeFocused()
  // Clear filters carries a tooltip, shown by the keyboard focus: the first Esc hides only that
  // (tooltip.spec.ts), the second closes the panel.
  await page.keyboard.press('Escape')
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(t).toHaveAttribute('aria-expanded', 'false')
  await expect(t).toBeFocused()
})

test('an outside click closes it', async ({ page }) => {
  const t = trigger(page, 'Details')
  const panel = await panelOf(t)
  await t.click()
  await expect(panel).toBeVisible()
  const r = await box(demo(page))
  await page.mouse.click(r.right - 2, r.top + 2) // the empty end of the demo row
  await expect(panel).toBeHidden()
  await expect(t).toHaveAttribute('aria-expanded', 'false')
})

test('a second click on the trigger closes it', async ({ page }) => {
  const t = trigger(page, 'Details')
  const panel = await panelOf(t)
  await t.click()
  await expect(panel).toBeVisible()
  await t.click()
  await expect(panel).toBeHidden()
  await expect(t).toHaveAttribute('aria-expanded', 'false')
})

test.describe('placement', () => {
  test('bottom/center sits below the trigger, centred', async ({ page }) => {
    // Centre the trigger so a phone viewport has room on both sides (the panel otherwise shifts
    // to stay on screen, which is the browser's job, not this check).
    await demo(page).evaluate((el) => (el.style.justifyContent = 'center'))
    await trigger(page, 'Filters').evaluate((el) => (el.style.display = 'none'))
    const t = trigger(page, 'Details')
    const panel = await panelOf(t)
    await t.click()
    await expect(panel).toBeVisible()
    const [a, p] = [await box(t), await box(panel)]
    expect(p.top - a.bottom).toBeCloseTo(GAP, 0)
    expect(Math.abs(p.cx - a.cx)).toBeLessThanOrEqual(1)
  })

  test('align=start lines up with the trigger start edge', async ({ page }) => {
    const t = trigger(page, 'Filters')
    const panel = await panelOf(t)
    await t.click()
    await expect(panel).toBeVisible()
    const [a, p] = [await box(t), await box(panel)]
    expect(p.top - a.bottom).toBeCloseTo(GAP, 0)
    expect(Math.abs(p.left - a.left)).toBeLessThanOrEqual(1)
  })

  for (const scope of ['page', 'section'] as const) {
    test(`align=start follows the writing direction under a ${scope} dir=rtl`, async ({
      page,
      browserName
    }) => {
      test.fixme(
        browserName === 'firefox' && scope === 'section',
        "Firefox resolves self-* position-area keywords against the top-layer containing block's LTR writing mode when dir=rtl is set on an ancestor section (css/components/anchored.css:41-43); the panel lands ~920px off"
      )
      // The panel sits in the top layer, so only self-relative position-area keywords follow a
      // dir set on an ancestor rather than on the root.
      const host = scope === 'page' ? page.locator('html') : demo(page)
      await host.evaluate((el) => el.setAttribute('dir', 'rtl'))
      const t = trigger(page, 'Filters')
      const panel = await panelOf(t)
      await t.click()
      await expect(panel).toBeVisible()
      const [a, p] = [await box(t), await box(panel)]
      expect(p.top - a.bottom).toBeCloseTo(GAP, 0)
      expect(Math.abs(p.right - a.right)).toBeLessThanOrEqual(1)
    })
  }

  test('flips above the trigger when there is no room below', async ({ page }) => {
    await page.addStyleTag({ content: '.bl-tab-bar { display: none !important; }' })
    await demo(page).evaluate((el) => {
      el.style.position = 'fixed'
      el.style.insetBlockEnd = '4px'
      el.style.insetInlineStart = '16px'
    })
    const t = trigger(page, 'Details')
    const panel = await panelOf(t)
    await t.click()
    await expect(panel).toBeVisible()
    const [a, p] = [await box(t), await box(panel)]
    expect(a.top - p.bottom).toBeCloseTo(GAP, 0)
  })
})

// One button that is both a popover trigger and a tooltip trigger: mergeProps keeps only one
// style.anchorName, so the README has the consumer set both names as a comma-separated list. Here
// the Details trigger takes the Copy hash tooltip's anchor name as well (Copy hash is hidden, so it
// anchors nothing) and both panels must sit against the one button. The list is set after the
// panel opens: opening re-renders the trigger (aria-expanded), and Vue would patch a style set
// earlier back to its own single name. A consumer's template carries the list, so Vue keeps it.
test('a trigger carrying both anchor names places the popover and a tooltip against it', async ({
  page
}) => {
  await page.addStyleTag({ content: '.bl-tab-bar { display: none !important; }' })
  await demo(page).evaluate((el) => {
    el.style.justifyContent = 'center'
    el.scrollIntoView({ block: 'center' })
  })
  await trigger(page, 'Filters').evaluate((el) => (el.style.display = 'none'))
  const tipTrigger = page
    .locator('[data-demo="tooltip"]')
    .getByRole('button', { name: 'Copy hash' })
  const tip = page.locator(`[id="${await tipTrigger.getAttribute('aria-describedby')}"]`)
  const t = trigger(page, 'Details')
  const panel = await panelOf(t)
  await t.click()
  await expect(panel).toBeVisible()
  const tipName = await tipTrigger.evaluate((el) => {
    const name = getComputedStyle(el).getPropertyValue('anchor-name')
    ;(el as HTMLElement).style.display = 'none'
    return name
  })
  // What mergeProps leaves: the popover's name alone. The tooltip then has no anchor.
  await tip.evaluate((el) => (el as HTMLElement).showPopover())
  expect(Math.abs((await box(t)).top - (await box(tip)).bottom - GAP)).toBeGreaterThan(1)
  await tip.evaluate((el) => (el as HTMLElement).hidePopover())
  const names = await t.evaluate((el, tipName) => {
    const popName = getComputedStyle(el).getPropertyValue('anchor-name')
    el.style.setProperty('anchor-name', `${popName}, ${tipName}`)
    return getComputedStyle(el).getPropertyValue('anchor-name')
  }, tipName)
  expect(names).toMatch(/^--bl-\S+, --bl-\S+$/)
  // The tooltip's own show path is covered by tooltip.spec.ts; only placement is checked here.
  await tip.evaluate((el) => (el as HTMLElement).showPopover())
  await expect(tip).toBeVisible()
  await expect(panel).toBeVisible()
  const [a, p, q] = [await box(t), await box(panel), await box(tip)]
  expect(p.top - a.bottom).toBeCloseTo(GAP, 0)
  expect(Math.abs(p.cx - a.cx)).toBeLessThanOrEqual(1)
  expect(a.top - q.bottom).toBeCloseTo(GAP, 0)
  expect(Math.abs(q.cx - a.cx)).toBeLessThanOrEqual(1)
})
