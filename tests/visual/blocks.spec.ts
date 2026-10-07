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

test.describe('BlToast', () => {
  test('each tone speaks in the right region', async ({ page }) => {
    await page.goto('/')
    await demo(page, 'toast').getByRole('button', { name: 'Toast' }).click()
    await demo(page, 'toast').getByRole('button', { name: 'Danger' }).click()
    await expect(page.locator('.bl-toaster [role="status"]')).toContainText('Saved')
    await expect(page.locator('.bl-toaster [role="alert"]')).toContainText('Upload failed')
  })

  test('a toast fired inside an open dialog is visible, reachable and announced', async ({
    page
  }) => {
    await page.goto('/')
    await demo(page, 'dialog').getByRole('button', { name: 'Rename' }).click()
    const dialog = page.getByRole('dialog', { name: 'Rename item' })
    await dialog.getByRole('button', { name: 'Copy name' }).click()
    const toastEl = dialog.locator('.bl-toast', { hasText: 'Copied' })
    await expect(toastEl).toBeVisible()
    await expect(dialog.locator('[role="status"]')).toContainText('Copied')
    const box = (await toastEl.boundingBox())!
    const hit = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x!, y!)?.closest('.bl-toast') !== null,
      [box.x + box.width / 2, box.y + box.height / 2]
    )
    expect(hit).toBe(true) // above the backdrop
    const dismiss = toastEl.getByRole('button', { name: 'Dismiss' })
    for (let i = 0; i < 12; i++) {
      if (await dismiss.evaluate((el) => el === document.activeElement)) break
      await page.keyboard.press('Tab')
    }
    await expect(dismiss).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.locator('.bl-dialog .bl-toaster')).toHaveCount(0)
    await expect(page.locator('.bl-toaster')).toHaveCount(1)
  })

  test('live regions are not atomic, so only the new line is spoken', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/')
    const cdp = await page.context().newCDPSession(page)
    const { root } = await cdp.send('DOM.getDocument')
    for (const role of ['status', 'alert']) {
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: `.bl-toaster [role="${role}"]`
      })
      const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
        nodeId,
        fetchRelatives: false
      })
      const atomic = nodes[0]?.properties?.find((p) => p.name === 'atomic')?.value.value
      expect(atomic, `${role} region atomic`).not.toBe(true)
    }
  })

  test('a toast fired as the dialog closes is spoken outside it', async ({ page }) => {
    await page.goto('/stress.html?case=dialog-toast')
    await page.getByRole('button', { name: 'Edit item' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit item' })
    await expect(dialog).toBeVisible()
    await page.evaluate(() => {
      const w = window as unknown as { appends: string[] }
      w.appends = []
      new MutationObserver((records) => {
        for (const r of records) {
          const region = r.target as Element
          if (!region.matches('[role="status"], [role="alert"]')) continue
          const d = region.closest('dialog')
          for (const n of r.addedNodes)
            w.appends.push(
              `${n.textContent} ${d ? (d.open ? 'in open dialog' : 'in closed dialog') : 'outside'}`
            )
        }
      }).observe(document.body, { childList: true, subtree: true })
    })
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()
    const status = page.locator('.bl-toaster [role="status"]')
    await expect(status).toContainText('Saved')
    expect(await status.evaluate((el) => el.closest('dialog') === null)).toBe(true)
    expect(await page.evaluate(() => (window as unknown as { appends: string[] }).appends)).toEqual(
      ['Saved outside']
    )
  })

  test('a toast in a bottom sheet leaves the footer actions reachable', async ({
    page
  }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'phone width only')
    await page.goto('/stress.html?case=dialog-toast')
    await page.getByRole('button', { name: 'Edit item' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit item' })
    await dialog.getByRole('button', { name: 'Copy' }).click()
    await expect(dialog.locator('.bl-toast', { hasText: 'Copied' })).toBeVisible()
    for (const name of ['Cancel', 'Save']) {
      const button = dialog.locator('.bl-dialog__foot').getByRole('button', { name })
      const box = (await button.boundingBox())!
      const hit = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x!, y!)?.closest('button')?.textContent?.trim(),
        [box.x + box.width / 2, box.y + box.height / 2]
      )
      expect(hit, `${name} is hit-testable`).toBe(name)
    }
  })

  test('a dialog opened from a toast action returns focus to where it was before the toast', async ({
    page
  }) => {
    await page.goto('/stress.html?case=dialog-toast')
    const notify = page.getByRole('button', { name: 'Notify' })
    await notify.focus()
    await page.keyboard.press('Enter')
    const action = page.locator('.bl-toast').getByRole('button', { name: 'Details' })
    await expect(action).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(action).toBeFocused()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Update details' })
    await expect(dialog).toBeVisible()
    await expect(page.locator('.bl-toast')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(notify).toBeFocused()
  })

  test.describe('motion', () => {
    test.use({ reducedMotion: 'no-preference' })
    test('focus returns past a toast still animating out when its dialog closes', async ({
      page
    }) => {
      await page.goto('/stress.html?case=dialog-toast')
      const notify = page.getByRole('button', { name: 'Notify' })
      await notify.focus()
      await page.keyboard.press('Enter')
      await expect(page.locator('.bl-toast')).toHaveCSS('opacity', '1')
      await page.keyboard.press('Tab')
      // Enter opens the dialog and dismisses the toast; Esc lands while it is still leaving.
      await page.keyboard.press('Enter')
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog', { name: 'Update details' })).toBeHidden()
      await expect(notify).toBeFocused()
    })

    test('the toasts above move, not snap, when a lower one leaves', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
      await page.goto('/')
      for (const name of ['Toast', 'Success'])
        await demo(page, 'toast').getByRole('button', { name }).click()
      const toasts = page.locator('.bl-toast')
      await expect(toasts).toHaveCount(2)
      await expect(toasts.nth(1)).toHaveCSS('opacity', '1')
      const ys = await page.evaluate(async () => {
        const [first, second] = [...document.querySelectorAll<HTMLElement>('.bl-toast')]
        const y = () => first!.getBoundingClientRect().top
        const out = [y()]
        second!.querySelector<HTMLElement>('.bl-toast__dismiss')!.click()
        for (let i = 0; i < 30; i++) {
          await new Promise(requestAnimationFrame)
          out.push(y())
        }
        return out
      })
      const total = ys.at(-1)! - ys[0]!
      expect(total, 'the first toast ends lower').toBeGreaterThan(20)
      const steps = ys.slice(1).map((y, i) => y - ys[i]!)
      expect(Math.max(...steps), `per-frame steps ${steps.join(', ')}`).toBeLessThan(total * 0.75)
    })
  })

  test('mouse hover pauses the toast timer', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile'), 'needs a hover pointer')
    await page.clock.install()
    await page.goto('/')
    await demo(page, 'toast').getByRole('button', { name: 'Toast' }).click()
    const t = page.locator('.bl-toast', { hasText: 'Saved' })
    await t.hover()
    await page.clock.runFor(8000)
    await expect(t).toBeVisible()
    await page.mouse.move(0, 0)
    await page.clock.runFor(5000)
    await expect(t).toHaveCount(0)
  })

  test('clears the tab bar on phones', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'phone width only')
    await page.goto('/')
    await demo(page, 'toast').getByRole('button', { name: 'Toast' }).click()
    const t = (await page.locator('.bl-toast').first().boundingBox())!
    const bar = await page.locator('.bl-tabbar').boundingBox()
    if (bar) expect(t.y + t.height).toBeLessThanOrEqual(bar.y)
  })
})

test.describe('motion', () => {
  test.use({ reducedMotion: 'no-preference' })
  test('the dialog animates in and out without an in-flow flash', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/')
    await demo(page, 'dialog').getByRole('button', { name: 'Rename' }).click()
    const dialog = page.locator('.bl-dialog[open]')
    await expect(dialog).toHaveCSS('opacity', '1')
    const open = (await dialog.boundingBox())!
    // close and sample in one evaluate, so the samples are of the exit transition
    const tops = await page.evaluate(async () => {
      const el = document.querySelector<HTMLDialogElement>('.bl-dialog[open]')!
      el.querySelector<HTMLElement>('.bl-dialog__close')!.click()
      const tops: number[] = []
      for (let i = 0; i < 20; i++) {
        await new Promise(requestAnimationFrame)
        const r = el.getBoundingClientRect()
        if (r.height > 0) tops.push(r.top)
      }
      return tops
    })
    expect(tops.length, 'sampled during the exit').toBeGreaterThan(2)
    for (const top of tops) expect(Math.abs(top - open.y)).toBeLessThan(40)
    await expect(page.locator('.bl-dialog[open]')).toHaveCount(0)
  })
})

test.describe('BlTable', () => {
  test('stays steady when an unrelated re-render re-measures it', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const table = demo(page, 'table-narrow').locator('.bl-table')
    await expect(table).toHaveAttribute('data-stacked', '')
    // Let the first stack (a real layout change) finish before sampling.
    await page.evaluate(async () => {
      await Promise.all(document.getAnimations().map((a) => a.finished))
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    })
    // The toggle re-renders the playground, which passes the table a new rows array.
    const heights = await page.evaluate(async () => {
      const el = document.querySelector('[data-demo="table-narrow"] .bl-table')!
      const out = [el.getBoundingClientRect().height]
      document.querySelector<HTMLInputElement>('[data-demo="toggle"] input')!.click()
      for (let i = 0; i < 4; i++) {
        await new Promise(requestAnimationFrame)
        out.push(el.getBoundingClientRect().height)
      }
      return out
    })
    expect(new Set(heights).size, `heights ${heights.join(', ')}`).toBe(1)
  })
})
