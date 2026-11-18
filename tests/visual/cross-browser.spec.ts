import { expect, test, type Locator, type Page } from '@playwright/test'

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

// WebKit marks the element showModal() focuses as :focus-visible even after a click; the modal
// focuses itself instead, so a mouse open rings nothing and Tab still reaches the × first.
for (const [name, openIt, role] of [
  [
    'dialog',
    (page: Page) => demo(page, 'dialog').getByRole('button', { name: 'Rename' }).click(),
    { name: 'Rename item' }
  ],
  [
    'lightbox',
    (page: Page) => demo(page, 'lightbox').locator('.pg-thumb').first().click(),
    { name: 'Image viewer' }
  ]
] as const) {
  test(`a ${name} opened by mouse shows no focus ring until Tab`, async ({ page, browserName }) => {
    // Nothing inside is focused on the way: a focus then blur would commit fields, flash
    // tooltips and run blur validation.
    await page.evaluate(() => {
      const w = window as unknown as { touched: string[] }
      w.touched = []
      document.addEventListener(
        'focusin',
        (e) => {
          const t = e.target as Element
          if (t.closest('dialog') && t.localName !== 'dialog') w.touched.push(t.className)
        },
        true
      )
    })
    await openIt(page)
    const modal = page.getByRole('dialog', role)
    await expect(modal).toBeVisible()
    await expect(modal).toBeFocused()
    expect(await page.evaluate(() => (window as unknown as { touched: string[] }).touched)).toEqual(
      []
    )
    // WebKit counts the dialog itself as :focus-visible (script focus after a click that never
    // focused the opener); it is a container and paints no ring. No control inside rings.
    const ringed = await modal.evaluate((el) =>
      [...el.querySelectorAll(':focus-visible')].map((node) => node.className)
    )
    expect(ringed).toEqual([])
    expect(await modal.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none')
    // macOS WebKit Tab-focuses buttons only with Option held (system default).
    const mac = browserName === 'webkit' && process.platform === 'darwin'
    await page.keyboard.press(mac ? 'Alt+Tab' : 'Tab')
    const close = modal.getByRole('button', { name: 'Close' })
    await expect(close).toBeFocused()
    expect(await close.evaluate((el) => el.matches(':focus-visible'))).toBe(true)
  })
}

// Exits play before close() in every browser, not only with Chromium's `overlay`: shortly after
// a close the modal is still open with its contents part-faded, and it is gone by 600ms.
type ExitSample = [showsAt50: boolean, lowestWhileShown: number, showsAt600: boolean]
// Timed in the page from the next click or keydown, so the runner's round trips (slow under
// load) cannot eat the window: whether `root` still shows 50ms in, the lowest opacity `fades`
// (or `root`) reached on any frame while it still showed, and whether it still shows at 600ms.
// The lowest frame, not one sample: a slow engine may not have painted a frame by 50ms.
const armExit = (root: Locator, fades: string | null) =>
  root.evaluate((el, sel) => {
    const shows = () => el.matches('dialog[open], :popover-open')
    const w = window as unknown as { exit?: Promise<ExitSample> }
    w.exit = new Promise((resolve) => {
      const start = () => {
        document.removeEventListener('click', start, true)
        document.removeEventListener('keydown', start, true)
        const fading = sel ? el.querySelector(sel)! : el
        let lowest = 1
        let at50 = false
        const frame = () => {
          if (!shows()) return
          lowest = Math.min(lowest, Number(getComputedStyle(fading).opacity))
          requestAnimationFrame(frame)
        }
        requestAnimationFrame(frame)
        setTimeout(() => (at50 = shows()), 50)
        setTimeout(() => resolve([at50, lowest, shows()]), 600)
      }
      document.addEventListener('click', start, true)
      document.addEventListener('keydown', start, true)
    })
  }, fades)
const readExit = (page: Page) =>
  page.evaluate(() => (window as unknown as { exit: Promise<ExitSample> }).exit)

test.describe('exit animations', () => {
  test.use({ reducedMotion: 'no-preference' })

  for (const [name, openIt, role, fades] of [
    [
      'dialog',
      (page: Page) => demo(page, 'dialog').getByRole('button', { name: 'Rename' }).click(),
      { name: 'Rename item' },
      '.bl-dialog__panel'
    ],
    [
      'lightbox',
      (page: Page) => demo(page, 'lightbox').locator('.pg-thumb').first().click(),
      { name: 'Image viewer' },
      '.bl-lightbox__stage'
    ]
  ] as const) {
    for (const how of ['×', 'Esc'] as const) {
      test(`a ${name} closed by ${how} fades out before it closes`, async ({ page }) => {
        await openIt(page)
        const modal = page.getByRole('dialog', role)
        await expect(modal).toBeVisible()
        // Let the entry finish so the exit starts from fully shown.
        await expect
          .poll(() => modal.locator(fades).evaluate((el) => getComputedStyle(el).opacity))
          .toBe('1')
        if (how === 'Esc') {
          // Firefox lets `cancel` be held only with recent user activation (else it closes at
          // once, which BlDialog allows for); a click on a part that does not close renews it.
          await modal
            .locator(name === 'dialog' ? '.bl-dialog__title' : '.bl-lightbox__count')
            .click()
        }
        await armExit(modal, fades)
        if (how === '×') await modal.getByRole('button', { name: 'Close' }).click()
        else await page.keyboard.press('Escape')
        const [open, lowest, openLater] = await readExit(page)
        expect(open, 'still open mid-exit').toBe(true)
        expect(lowest, 'faded while still open').toBeLessThan(1)
        expect(openLater, 'closed by 600ms').toBe(false)
        await expect(page.locator(`.bl-${name}[open]`)).toHaveCount(0)
      })
    }
  }

  // pointer-events: none stops only the mouse; the panel is inert during the exit, so keys
  // pressed meanwhile reach nothing in it. A 2s exit keeps the window open on a slow runner.
  test('keys pressed during a dialog exit reach nothing inside it', async ({ page }) => {
    await page.addStyleTag({
      content: '.bl-dialog__panel { transition-duration: 2s !important; }'
    })
    const opener = demo(page, 'dialog').getByRole('button', { name: 'Delete project' })
    await opener.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Delete project?' })
    await expect(dialog.getByRole('button', { name: 'Keep' })).toBeFocused()
    await expect(dialog.locator('.bl-dialog__panel')).toHaveCSS('opacity', '1')
    await dialog.evaluate((d) => {
      const w = window as unknown as { pressed: string[] }
      w.pressed = []
      for (const b of d.querySelectorAll('button'))
        b.addEventListener('click', () => w.pressed.push(b.textContent!.trim()))
    })
    await page.keyboard.press('Enter') // Keep: starts the exit
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    expect(await dialog.evaluate((d) => d.hasAttribute('data-closing'))).toBe(true)
    await expect(page.locator('.bl-dialog[open]')).toHaveCount(0, { timeout: 5000 })
    expect(await page.evaluate(() => (window as unknown as { pressed: string[] }).pressed)).toEqual(
      ['Keep']
    )
    await expect(opener).toBeFocused()
  })

  // Closes the component starts: a hovered tooltip's Esc, a popover trigger's second click.
  for (const [name, openIt, closeIt] of [
    [
      'tooltip',
      async (page: Page) => {
        const t = demo(page, 'tooltip').getByRole('button', { name: 'Copy hash', exact: true })
        await t.hover()
        return page.locator(`[id="${await t.getAttribute('aria-describedby')}"]`)
      },
      (page: Page) => page.keyboard.press('Escape')
    ],
    [
      'popover',
      async (page: Page) => {
        const t = demo(page, 'popover').getByRole('button', { name: 'Details', exact: true })
        await t.click()
        return page.locator(`[id="${await t.getAttribute('aria-controls')}"]`)
      },
      (page: Page) =>
        demo(page, 'popover').getByRole('button', { name: 'Details', exact: true }).click()
    ]
  ] as const) {
    test(`a ${name} fades out before it hides`, async ({ page }) => {
      const panel = await openIt(page)
      await expect(panel).toBeVisible()
      await expect.poll(() => panel.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
      await armExit(panel, null)
      await closeIt(page)
      const [open, lowest, openLater] = await readExit(page)
      expect(open, 'still showing mid-exit').toBe(true)
      expect(lowest, 'faded while still showing').toBeLessThan(1)
      expect(openLater, 'hidden by 600ms').toBe(false)
      await expect(panel).toBeHidden()
    })
  }
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
