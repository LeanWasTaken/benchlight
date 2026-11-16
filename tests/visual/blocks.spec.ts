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

test.describe('BlCheckbox', () => {
  test('Space ticks the box', async ({ page }) => {
    await page.goto('/')
    const input = demo(page, 'checkbox').getByRole('checkbox', { name: 'Send metrics' })
    await expect(input).not.toBeChecked()
    await input.focus()
    await page.keyboard.press('Space')
    await expect(input).toBeChecked()
  })

  test('a click clears the dash and ticks the box', async ({ page }) => {
    await page.goto('/')
    const input = demo(page, 'checkbox').getByRole('checkbox', { name: 'All channels' })
    await expect(input).toHaveJSProperty('indeterminate', true)
    const mark = () =>
      input.evaluate((el) => {
        const style = getComputedStyle(el.nextElementSibling!, '::after')
        return `${style.width} ${style.height}`
      })
    expect(await mark(), 'dash').toBe('12px 2px')
    // Click the drawn box, as a user does; the hidden input sits under it.
    await input.locator('xpath=following-sibling::span[1]').click()
    await expect(input).toHaveJSProperty('indeterminate', false)
    await expect(input).toBeChecked()
    // Chromium can report the pseudo-element's old box for a few frames after the change.
    await expect.poll(mark, { message: 'tick' }).toBe('6px 11px')
  })

  test('a native Reset restores the initial state and the v-model follows', async ({ page }) => {
    await page.goto('/')
    const form = demo(page, 'checkbox-reset')
    const input = form.getByRole('checkbox', { name: 'Keep logs' })
    const state = demo(page, 'checkbox-state')
    await expect(input).toBeChecked()
    await input.focus()
    await page.keyboard.press('Space')
    await expect(state).toHaveText('false')
    await form.getByRole('button', { name: 'Reset' }).click()
    await expect(input).toBeChecked()
    await expect(state).toHaveText('true')
  })

  test.describe('forced colors', () => {
    test.use({ forcedColors: 'active' })
    test('checked, indeterminate and unchecked boxes stay distinguishable', async ({ page }) => {
      await page.goto('/')
      const box = (name: string) =>
        demo(page, 'checkbox')
          .locator('.bl-checkbox', { hasText: name })
          .locator('.bl-checkbox__box')
          .evaluate((el) => {
            const after = getComputedStyle(el, '::after')
            return `${getComputedStyle(el).backgroundColor} ${after.display}`
          })
      const [mixed, on, off] = [
        await box('All channels'),
        await box('Nightly backups'),
        await box('Send metrics')
      ]
      expect(on).not.toBe(off)
      expect(mixed).not.toBe(off)
    })
    test('a disabled box reads as disabled, ticked or not', async ({ page }) => {
      await page.goto('/')
      const label = (name: string) =>
        demo(page, 'checkbox')
          .locator('.bl-checkbox', { hasText: name })
          .locator('.bl-checkbox__label')
          .evaluate((el) => getComputedStyle(el).color)
      expect(await label('Required by policy')).not.toBe(await label('Send metrics'))
      const [fill, ground] = await demo(page, 'checkbox')
        .locator('.bl-checkbox', { hasText: 'Required by policy' })
        .locator('.bl-checkbox__box')
        .evaluate((el) => [
          getComputedStyle(el).backgroundColor,
          getComputedStyle(document.body).backgroundColor
        ])
      expect(fill, 'no Highlight fill on a disabled, checked box').toBe(ground)
    })
  })
})

test.describe('BlRadioGroup', () => {
  test('arrow keys move and select; Tab leaves the group', async ({ page }) => {
    await page.goto('/')
    const group = demo(page, 'radio').getByRole('radiogroup', { name: 'Band' })
    const radio = (name: string) => group.getByRole('radio', { name })
    const state = demo(page, 'radio-state')
    await expect(radio('5 GHz')).toBeChecked()
    await radio('5 GHz').focus()
    await page.keyboard.press('ArrowDown')
    await expect(radio('6 GHz')).toBeFocused()
    await expect(radio('6 GHz')).toBeChecked()
    await expect(state).toHaveText('6')
    // The last option wraps to the first, natively.
    await page.keyboard.press('ArrowDown')
    await expect(radio('2.4 GHz')).toBeFocused()
    await expect(radio('2.4 GHz')).toBeChecked()
    await page.keyboard.press('ArrowUp')
    await expect(radio('6 GHz')).toBeChecked()
    await expect(state).toHaveText('6')
    // One tab stop per group: Tab lands on the next group's checked radio, Shift+Tab comes back
    // to this group's checked radio, not its first.
    await page.keyboard.press('Tab')
    const next = demo(page, 'radio').getByRole('radiogroup', { name: 'Channel width' })
    await expect(next.getByRole('radio', { name: '40 MHz' })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(radio('6 GHz')).toBeFocused()
  })

  test('arrow keys skip a disabled option', async ({ page }) => {
    await page.goto('/')
    const group = demo(page, 'radio').getByRole('radiogroup', { name: 'Channel width' })
    await group.getByRole('radio', { name: '40 MHz' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(group.getByRole('radio', { name: '20 MHz' })).toBeChecked()
  })

  test.describe('forced colors', () => {
    test.use({ forcedColors: 'active' })
    test('checked and unchecked dots stay distinguishable; disabled has no Highlight', async ({
      page
    }) => {
      await page.goto('/')
      const dot = (name: string) =>
        demo(page, 'radio')
          .locator('.bl-radio', { hasText: name })
          .locator('.bl-radio__dot')
          .evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(await dot('5 GHz')).not.toBe(await dot('6 GHz'))
      const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
      expect(await dot('Automatic'), 'no Highlight fill on a disabled, checked dot').toBe(ground)
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
    const bar = await page.locator('.bl-tab-bar').boundingBox()
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
    await expect(dialog.locator('.bl-dialog__panel')).toHaveCSS('opacity', '1')
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

test.describe('motion: toast exit', () => {
  test.use({ reducedMotion: 'no-preference' })
  test('a dismissed toast fades over several frames and stays where it is', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/')
    for (const name of ['Toast', 'Success'])
      await demo(page, 'toast').getByRole('button', { name }).click()
    const toasts = page.locator('.bl-toast')
    await expect(toasts).toHaveCount(2)
    await expect(toasts.nth(1)).toHaveCSS('opacity', '1')
    const frames = await page.evaluate(async () => {
      const [first, second] = [...document.querySelectorAll<HTMLElement>('.bl-toast')]
      const out: { opacity: number; top: number; above: number }[] = []
      second!.querySelector<HTMLElement>('.bl-toast__dismiss')!.click()
      for (let i = 0; i < 30 && second!.isConnected; i++) {
        await new Promise(requestAnimationFrame)
        if (!second!.isConnected) break
        out.push({
          opacity: Number(getComputedStyle(second!).opacity),
          top: second!.getBoundingClientRect().top,
          above: first!.getBoundingClientRect().top
        })
      }
      return out
    })
    const fading = frames.filter((f) => f.opacity > 0.05 && f.opacity < 0.95)
    expect(
      fading.length,
      `opacity per frame ${frames.map((f) => f.opacity.toFixed(2))}`
    ).toBeGreaterThan(4)
    const tops = frames.map((f) => f.top)
    expect(Math.max(...tops) - Math.min(...tops), `tops ${tops}`).toBeLessThan(12)
    // the toast above glides into the freed slot over several frames
    const above = new Set(frames.map((f) => Math.round(f.above * 10)))
    expect(above.size, `above ${[...above]}`).toBeGreaterThan(3)
  })
})

test.describe('motion: CSS-only dialog', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('a CSS-only panel wrapped in a form still opens, as a box and as a sheet', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/stress.html?case=dialog-form')
    const open = page.getByRole('button', { name: 'Open form dialog' })
    const dialog = page.getByRole('dialog', { name: 'Form dialog' })
    const panel = dialog.locator('form > .bl-dialog__panel')
    await open.click()
    await expect(panel).toHaveCSS('opacity', '1')
    await expect(panel).toHaveCSS('scale', 'none')
    await dialog.getByRole('button', { name: 'OK' }).click() // <form method="dialog">
    await expect(dialog).toBeHidden()

    await page.setViewportSize({ width: 390, height: 844 })
    await open.click()
    await expect(panel).toHaveCSS('translate', 'none')
    await expect(panel).toHaveCSS('opacity', '1')
    const r = (await panel.boundingBox())!
    expect(r.y, 'the sheet is on screen').toBeLessThan(844 - 100)
    expect(r.y + r.height).toBeLessThanOrEqual(844.5)
    await dialog.getByRole('button', { name: 'OK' }).click()
    await expect(dialog).toBeHidden()
  })
})

test.describe('motion: toasts and dialogs', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('a visible toast stays put while a dialog opens over it', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/stress.html?case=dialog-toast')
    await page.getByRole('button', { name: 'Notify' }).click()
    const t = page.locator('.bl-toast', { hasText: 'Update ready' })
    await expect(t).toHaveCSS('opacity', '1')
    const frames = await page.evaluate(async () => {
      const toast = document.querySelector<HTMLElement>('.bl-toast')!
      // what the eye sees: the toast's opacity times every ancestor's
      const seen = () => {
        let o = 1
        for (let n: Element | null = toast; n; n = n.parentElement)
          o *= Number(getComputedStyle(n).opacity)
        return o
      }
      const box = () => {
        const r = toast.getBoundingClientRect()
        return { x: r.x, y: r.y, w: r.width, h: r.height, o: seen() }
      }
      const out = [{ ...box(), inDialog: false, entering: false }]
      const opener = [...document.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Edit item')
      )!
      opener.click()
      await Promise.resolve() // the open watcher calls showModal() in a microtask
      const dialog = document.querySelector<HTMLDialogElement>('dialog[open]')!
      for (let i = 0; i < 24; i++) {
        await new Promise(requestAnimationFrame)
        out.push({
          ...box(),
          inDialog: dialog.contains(toast),
          entering: dialog.getAnimations({ subtree: true }).length > 0
        })
      }
      return out
    })
    expect(
      frames.filter((f) => f.inDialog && f.entering).length,
      'sampled inside the dialog during its entry'
    ).toBeGreaterThan(0)
    const [first] = frames
    for (const f of frames) {
      expect(Math.abs(f.x - first!.x), `x per frame ${frames.map((f) => f.x)}`).toBeLessThan(0.5)
      expect(Math.abs(f.y - first!.y), `y per frame ${frames.map((f) => f.y)}`).toBeLessThan(0.5)
      expect(Math.abs(f.w - first!.w), `width per frame ${frames.map((f) => f.w)}`).toBeLessThan(
        0.5
      )
      expect(f.o, `opacity per frame ${frames.map((f) => f.o.toFixed(2))}`).toBe(1)
    }
  })

  test('toasts stay on top while a dialog fades out, and speak outside it', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/stress.html?case=dialog-toast')
    await page.getByRole('button', { name: 'Edit item' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit item' })
    const panel = dialog.locator('.bl-dialog__panel')
    await expect(panel).toHaveCSS('opacity', '1')
    await dialog.getByRole('button', { name: 'Copy' }).click()
    await expect(page.locator('.bl-toast', { hasText: 'Copied' })).toHaveCSS('opacity', '1')
    const result = await page.evaluate(async () => {
      const appends: string[] = []
      new MutationObserver((records) => {
        for (const r of records) {
          const region = r.target as Element
          if (!region.matches('[role="status"], [role="alert"]')) continue
          for (const n of r.addedNodes)
            appends.push(`${n.textContent} ${region.closest('dialog') ? 'inside' : 'outside'}`)
        }
      }).observe(document.body, { childList: true, subtree: true })
      const d = document.querySelector<HTMLDialogElement>('dialog[open]')!
      const copied = document.querySelector<HTMLElement>('.bl-toast')!
      const save = [...d.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Save')!
      save.click()
      const frames: { closing: boolean; hit: boolean }[] = []
      for (let i = 0; i < 24; i++) {
        await new Promise(requestAnimationFrame)
        const r = copied.getBoundingClientRect()
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
        frames.push({
          closing: !d.open && getComputedStyle(d).display !== 'none',
          hit: top?.closest('.bl-toast') !== null // the entering 'Saved' toast may slide under
        })
      }
      return { frames, appends }
    })
    const closing = result.frames.filter((f) => f.closing)
    expect(closing.length, 'sampled during the exit').toBeGreaterThan(0)
    expect(
      closing.filter((f) => !f.hit).length,
      `hits per exit frame ${closing.map((f) => f.hit)}`
    ).toBe(0)
    expect(result.frames.every((f) => f.hit)).toBe(true)
    expect(result.appends).toEqual(['Saved outside'])
    const saved = page.locator('.bl-toast', { hasText: 'Saved' })
    await expect(saved).toBeVisible()
    await saved.getByRole('button', { name: 'Dismiss' }).click() // its timer must not move 'Copied'
    await expect(page.locator('.bl-toast')).toHaveCount(1)

    // Hit-testing skips a closing dialog either way, so also compare pixels: freeze the exit
    // a few frames in and the toast must look exactly as it does once the dialog has gone.
    await page.getByRole('button', { name: 'Edit item' }).click()
    await expect(panel).toHaveCSS('opacity', '1')
    const copied = page.locator('.bl-toast', { hasText: 'Copied' })
    const clip = (await copied.boundingBox())!
    const frozen = await page.evaluate(async () => {
      const d = document.querySelector<HTMLDialogElement>('dialog[open]')!
      const cancel = [...d.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Cancel'
      )!
      cancel.click()
      await new Promise(requestAnimationFrame)
      // Freeze the exit at a fixed point (80ms of 200ms), whatever the frame rate.
      document.getAnimations().forEach((a) => {
        a.pause()
        a.currentTime = 80
      })
      await new Promise(requestAnimationFrame)
      return Number(getComputedStyle(d.querySelector('.bl-dialog__panel')!).opacity)
    })
    expect(frozen, 'frozen mid-exit').toBeGreaterThan(0.2)
    expect(frozen, 'frozen mid-exit').toBeLessThan(0.95)
    const during = await page.screenshot({ clip })
    await page.evaluate(() => document.getAnimations().forEach((a) => a.play()))
    await expect(page.locator('dialog.bl-dialog').first()).toHaveCSS('display', 'none')
    await expect(page.locator('.bl-toaster[popover]')).toHaveCount(0)
    const after = await page.screenshot({ clip })
    // Mean channel difference: text antialiasing may differ by a level in the top layer, but
    // the backdrop (70% canvas) dims the toast surface by far more.
    const diff = await page.evaluate(
      async ([a, b]) => {
        const pixels = async (src: string) => {
          const img = new Image()
          img.src = `data:image/png;base64,${src}`
          await img.decode()
          const c = new OffscreenCanvas(img.width, img.height)
          const ctx = c.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          return ctx.getImageData(0, 0, img.width, img.height).data
        }
        const [x, y] = await Promise.all([pixels(a!), pixels(b!)])
        let sum = 0
        for (let i = 0; i < x.length; i++) sum += Math.abs(x[i]! - y[i]!)
        return sum / x.length
      },
      [during.toString('base64'), after.toString('base64')]
    )
    expect(diff, 'the toast is not dimmed by the closing dialog').toBeLessThan(1)
  })

  test('a close and reopen in the same task ends open, with one emit per session', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/stress.html?case=dialog-toast')
    await page.getByRole('button', { name: 'Edit item' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit item' })
    await expect(dialog.locator('.bl-dialog__panel')).toHaveCSS('opacity', '1')
    const log = page.locator('[data-log]')
    const frames = await page.evaluate(async () => {
      const d = document.querySelector<HTMLDialogElement>('dialog[open]')!
      const closes: boolean[] = []
      d.addEventListener('close', () => closes.push(d.open))
      const reopen = [...d.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Reopen'
      )!
      reopen.click() // false, nextTick, true: all before the browser's close event
      const out: { open: boolean; locked: string }[] = []
      for (let i = 0; i < 16; i++) {
        await new Promise(requestAnimationFrame)
        out.push({
          open: d.open,
          locked: getComputedStyle(document.documentElement).overflowY
        })
      }
      return { out, closes }
    })
    expect(frames.closes, 'the late close event arrived while open again').toEqual([true])
    expect(frames.out.every((f) => f.open && f.locked === 'hidden')).toBe(true)
    await expect(dialog).toBeVisible()
    await expect(log).toHaveText('close:program')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(log).toHaveText('close:program update:false close:escape')
    await expect(page.locator('html')).toHaveCSS('overflow-y', 'visible')
    expect(
      await page.evaluate(() =>
        document.documentElement.style.getPropertyValue('--bl-dialog-gutter')
      )
    ).toBe('')
  })
})

test.describe('motion: theme flip', () => {
  test.use({ reducedMotion: 'no-preference' })
  test('a theme change crossfades the page in one view transition', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/')
    const result = await page.evaluate(async () => {
      const doc = document as Document & {
        startViewTransition?: (update: () => void) => unknown
      }
      const original = doc.startViewTransition!.bind(document)
      let calls = 0
      doc.startViewTransition = (update) => {
        calls++
        return original(update)
      }
      const seen = new Set<string>()
      document.querySelector<HTMLInputElement>('.bl-appearance input[value="dark"]')!.click()
      for (let i = 0; i < 40; i++) {
        await new Promise(requestAnimationFrame)
        for (const a of document.documentElement.getAnimations({ subtree: true })) {
          const effect = a.effect as KeyframeEffect
          if (effect.pseudoElement?.startsWith('::view-transition'))
            seen.add(`${effect.pseudoElement} ${effect.getComputedTiming().duration}`)
        }
      }
      return { calls, seen: [...seen] }
    })
    expect(result.calls).toBe(1)
    expect(result.seen).toContain('::view-transition-new(root) 200')
    expect(result.seen).toContain('::view-transition-old(root) 200')
    await expect(page.locator('html')).toHaveAttribute('data-bl-appearance', 'dark')
  })

  test('a flip runs few animations on a page with a 300-row table', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/')
    await page.evaluate(() => {
      const cell = (r: number, c: number) =>
        `<td class="bl-table__num"><span class="bl-annotation">${r * c}</span></td>`
      const rows = Array.from(
        { length: 300 },
        (_, r) => `<tr>${Array.from({ length: 6 }, (_, c) => cell(r, c)).join('')}</tr>`
      ).join('')
      const wrap = document.createElement('div')
      wrap.className = 'bl-table'
      wrap.innerHTML = `<table class="bl-table__table"><tbody>${rows}</tbody></table>`
      document.body.append(wrap)
    })
    const peak = await page.evaluate(async () => {
      let max = 0
      document.querySelector<HTMLInputElement>('.bl-appearance input[value="dark"]')!.click()
      for (let i = 0; i < 45; i++) {
        await new Promise(requestAnimationFrame)
        max = Math.max(max, document.getAnimations().length)
      }
      return max
    })
    // Per-element colour transitions ran thousands at once (6,784 here); the crossfade is a
    // handful of pseudo-element animations plus the page's own few hundred.
    expect(peak, 'running animations during the flip').toBeLessThan(1000)
  })
})

test.describe('motion: state changes', () => {
  test.use({ reducedMotion: 'no-preference' })
  test('an idle EQ leaves nothing to wait on', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/')
    const result = await page.evaluate(async () => {
      for (const eq of document.querySelectorAll('.bl-eq--active'))
        eq.classList.remove('bl-eq--active')
      const settled = await Promise.race([
        Promise.allSettled(
          document
            .getAnimations()
            .filter((a) => (a.effect as KeyframeEffect).target?.closest('.bl-eq'))
            .map((a) => a.finished)
        ).then(() => true),
        new Promise((r) => setTimeout(() => r(false), 800))
      ])
      return { settled }
    })
    expect(result.settled, 'getAnimations().finished resolves with idle bars').toBe(true)
  })

  test('stopping an EQ glides the bars home over several frames', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/stress.html?case=eq-settle')
    const toggle = page.getByRole('button', { name: 'Toggle EQ' })
    await toggle.click()
    await page.waitForTimeout(1000)
    const frames = await page.evaluate(async () => {
      const bar = document.querySelector<HTMLElement>('.bl-eq__bar:nth-child(4)')!
      document.querySelector<HTMLButtonElement>('button')!.click()
      const out: string[] = []
      for (let i = 0; i < 14; i++) {
        await new Promise(requestAnimationFrame)
        out.push(getComputedStyle(bar).transform)
      }
      return out
    })
    expect(new Set(frames).size, `transform per frame ${frames}`).toBeGreaterThan(3)
    expect(frames.at(-1)).toBe('none')
  })

  test('the marquee glides home over several frames when its text stops overflowing', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/stress.html?case=marquee-glide')
    await page.waitForTimeout(2500)
    const frames = await page.evaluate(async () => {
      const box = document.querySelector<HTMLElement>('.bl-marquee')!
      const text = box.querySelector<HTMLElement>('.bl-marquee__content')!
      ;[...document.querySelectorAll<HTMLButtonElement>('button')]
        .find((b) => b.textContent?.trim() === 'Shorten')!
        .click()
      // transforms from the frame the loop has stopped (the overflow mark is gone) onwards
      const out: string[] = []
      for (let i = 0; i < 60; i++) {
        await new Promise(requestAnimationFrame)
        if (!box.hasAttribute('data-overflowing')) out.push(getComputedStyle(text).transform)
      }
      return out
    })
    const distinct = new Set(frames.filter((f) => f !== 'none'))
    expect(distinct.size, `transform per frame after the loop stops ${frames}`).toBeGreaterThan(3)
    expect(frames.at(-1)).toBe('none')
  })

  test('an LED fades between off and on instead of switching in one frame', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/')
    const frames = await page.evaluate(async () => {
      const led = document.querySelector<HTMLElement>(
        '.bl-led:not(.bl-led--on):not(.bl-led--danger)'
      )!
      const out: { bg: string; glow: string }[] = []
      led.classList.add('bl-led--on')
      for (let i = 0; i < 20; i++) {
        await new Promise(requestAnimationFrame)
        const cs = getComputedStyle(led)
        out.push({ bg: cs.backgroundColor, glow: cs.boxShadow })
      }
      return out
    })
    expect(new Set(frames.map((f) => f.bg)).size, 'distinct background frames').toBeGreaterThan(3)
    expect(new Set(frames.map((f) => f.glow)).size, 'distinct glow frames').toBeGreaterThan(3)
  })

  test('a pagination button eases its hover background', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/')
    const button = page
      .locator('.bl-pagination__page:not([aria-current="page"]):not([aria-disabled="true"])')
      .first()
    await button.scrollIntoViewIfNeeded()
    await page.mouse.move(2, 2)
    await page.waitForTimeout(300)
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(
        '.bl-pagination__page:not([aria-current="page"]):not([aria-disabled="true"])'
      )!
      const seen = new Set<string>()
      ;(window as unknown as { __seen: Set<string> }).__seen = seen
      const tick = () => {
        seen.add(getComputedStyle(el).backgroundColor)
        requestAnimationFrame(tick)
      }
      tick()
    })
    await button.hover()
    await page.waitForTimeout(400)
    const seen = await page.evaluate(() => [
      ...(window as unknown as { __seen: Set<string> }).__seen
    ])
    expect(seen.length, `background frames ${seen.join(' | ')}`).toBeGreaterThan(2)
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
