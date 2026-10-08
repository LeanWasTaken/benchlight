import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

test('the playground has no axe violations', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

test('the log is keyboard-reachable and scrollable', async ({ page }) => {
  await page.goto('/')
  const log = page.locator('pre.bl-log')
  // Chromium makes overflowing scrollers focusable on its own, so assert the
  // explicit tab stop too, which keeps non-scrolling and older engines covered.
  await expect(log).toHaveAttribute('tabindex', '0')
  await log.focus()
  await expect(log).toBeFocused()
  await page.keyboard.press('End')
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  await page.keyboard.press('Home')
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBe(0)
  // Retry the key: under a loaded CI runner Chromium can drop a press that lands just as
  // the Home scroll settles. A log that ignores arrows still fails every attempt.
  await expect(async () => {
    await page.keyboard.press('ArrowDown')
    expect(await log.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  }).toPass({ timeout: 5000 })
})

test('the skip-link target takes focus without a ring', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  const main = page.locator('main#main-content')
  await expect(main).toBeFocused()
  expect(await main.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none')
})

test('a focused control is not hidden under the mobile tab bar', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'tab bar is mobile-only')
  await page.goto('/')
  const select = page.locator('select.bl-select')
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab')
    if (await select.evaluate((el) => el === document.activeElement)) break
  }
  await expect(select).toBeFocused()
  const field = await select.boundingBox()
  const bar = await page.locator('.bl-tab-bar').boundingBox()
  expect(field).not.toBeNull()
  expect(bar).not.toBeNull()
  expect(field!.y + field!.height).toBeLessThanOrEqual(bar!.y)
})

test('the log stays put while scrolled up and follows while pinned', async ({ page }) => {
  await page.goto('/')
  const log = page.locator('pre.bl-log')
  const append = page.getByRole('button', { name: 'Append line' })
  const lineCount = () => log.evaluate((el) => el.textContent?.split('\n').length ?? 0)
  const distanceFromBottom = () =>
    log.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight)

  await log.focus()
  // the log starts at the bottom, so this first End is a no-op that keeps
  // the focus-and-keyboard path honest; a scroll event is what unpins the
  // log, and Home then moves it up to fire one
  await page.keyboard.press('End')
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  await page.keyboard.press('Home')
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBe(0)
  const before = await lineCount()
  await append.click()
  await expect.poll(lineCount).toBeGreaterThan(before)
  expect(await log.evaluate((el) => el.scrollTop)).toBe(0)

  await log.focus()
  await page.keyboard.press('End')
  await expect.poll(distanceFromBottom).toBeLessThanOrEqual(4)
  const pinnedCount = await lineCount()
  await append.click()
  await expect.poll(lineCount).toBeGreaterThan(pinnedCount)
  await expect.poll(distanceFromBottom).toBeLessThanOrEqual(4)
})

test('a keyboard-focused radio segmented item shows a ring', async ({ page }) => {
  await page.goto('/')
  const radio = page.getByRole('radio', { name: 'M', exact: true })
  const item = page.locator('.bl-segmented__item', { has: radio })
  await radio.focus()
  await page.keyboard.press('ArrowRight')
  const next = page.locator('.bl-segmented__item', { has: page.getByRole('radio', { name: 'L' }) })
  await expect(next.locator('input')).toBeFocused()
  const ring = await next.evaluate((el) => {
    const style = getComputedStyle(el)
    return { style: style.outlineStyle, width: style.outlineWidth }
  })
  expect(ring).toEqual({ style: 'solid', width: '2px' })
  expect(await item.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none')
})

test.describe('forced colors', () => {
  test.use({ forcedColors: 'active' })

  // A shape is visible when it paints a fill other than the page ground, or a border or outline.
  const visible = ({ selector }: { selector: string }) => {
    const el = document.querySelector(selector)!
    const style = getComputedStyle(el)
    const ground = getComputedStyle(document.body).backgroundColor
    const fill = style.backgroundColor !== ground && style.backgroundColor !== 'rgba(0, 0, 0, 0)'
    const edge = parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== 'none'
    const outline = parseFloat(style.outlineWidth) > 0 && style.outlineStyle !== 'none'
    return fill || edge || outline
  }

  for (const selector of [
    '.bl-led',
    '.bl-led--on',
    '.bl-led--danger',
    '.bl-meter',
    '.bl-meter__fill',
    '.bl-eq__bar',
    '.bl-segmented__item[aria-pressed="true"]',
    '.bl-segmented__item:has(:checked)',
    '.bl-btn[aria-pressed="true"]'
  ]) {
    test(`${selector} stays visible`, async ({ page }) => {
      await page.goto('/')
      expect(await page.evaluate(visible, { selector })).toBe(true)
    })
  }

  test('a hovered pressed button keeps Highlight colours', async ({ page }) => {
    await page.goto('/')
    const button = page.locator('.bl-btn--secondary[aria-pressed="true"]').first()
    await button.scrollIntoViewIfNeeded()
    await button.hover()
    await page.waitForTimeout(400)
    const colours = await button.evaluate((el) => {
      const probe = document.createElement('span')
      probe.style.cssText = 'color: HighlightText; background: Highlight'
      document.body.append(probe)
      const expected = getComputedStyle(probe)
      const out = {
        background: [getComputedStyle(el).backgroundColor, expected.backgroundColor],
        color: [getComputedStyle(el).color, expected.color]
      }
      probe.remove()
      return out
    })
    expect(colours.background[0]).toBe(colours.background[1])
    expect(colours.color[0]).toBe(colours.color[1])
  })

  test('telemetry cell dividers stay visible', async ({ page }) => {
    await page.goto('/')
    const divider = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelectorAll('.bl-telemetry__cell')[1]!)
      return {
        left: parseFloat(style.borderLeftWidth) > 0 && style.borderLeftStyle !== 'none',
        shadow: style.boxShadow !== 'none'
      }
    })
    expect(divider.left || divider.shadow).toBe(true)
  })

  test('the success message dot stays visible', async ({ page }) => {
    await page.goto('/')
    const dot = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector('.bl-msg--success')!, '::before')
      return {
        fill: style.backgroundColor,
        ground: getComputedStyle(document.body).backgroundColor
      }
    })
    expect(dot.fill).not.toBe(dot.ground)
  })

  test('the selected segment is painted with the Highlight system colour', async ({ page }) => {
    await page.goto('/')
    const { on, off, highlight } = await page.evaluate(() => {
      const bg = (el: Element) => getComputedStyle(el).backgroundColor
      const probe = document.body.appendChild(document.createElement('div'))
      probe.style.background = 'Highlight'
      const highlight = bg(probe)
      probe.remove()
      return {
        on: bg(document.querySelector('.bl-segmented__item[aria-pressed="true"]')!),
        off: bg(document.querySelector('.bl-segmented__item[aria-pressed="false"]')!),
        highlight
      }
    })
    expect(on).toBe(highlight)
    expect(off).not.toBe(highlight)
  })
})

test('invisible hit areas reach 44px at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const targets = await page.evaluate(() => {
    const selectors = [
      '.bl-link-arrow',
      '.bl-colophon__items a',
      '.bl-appearance__option',
      '.bl-segmented__item',
      '.bl-segmented--compact .bl-segmented__item'
    ]
    return selectors.flatMap((selector) =>
      [...document.querySelectorAll(selector)].map((el, index) => {
        const box = el.getBoundingClientRect()
        const pseudo = getComputedStyle(el, '::before')
        const covers = pseudo.content !== 'none' && pseudo.position === 'absolute'
        return {
          name: `${selector}[${index}]`,
          width: Math.max(box.width, covers ? parseFloat(pseudo.width) : 0),
          height: Math.max(box.height, covers ? parseFloat(pseudo.height) : 0)
        }
      })
    )
  })
  expect(targets.length).toBeGreaterThan(10)
  for (const target of targets) {
    expect(target.width, `${target.name} width`).toBeGreaterThanOrEqual(44)
    expect(target.height, `${target.name} height`).toBeGreaterThanOrEqual(44)
  }
})

test.describe('tables', () => {
  const demo = (page: Page, name: string) => page.locator(`[data-demo="${name}"]`)

  /** Put the keyboard position just before a demo so the next Tab enters it. */
  async function focusBefore(page: Page, name: string): Promise<void> {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    // Tab only once the fit has settled: a stacked flip swaps header buttons for spans.
    await page.locator(`[data-demo="${name}"] .bl-table[data-fit]:not([data-measuring])`).waitFor()
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    )
    await page.evaluate((name) => {
      const before = document.querySelector(`[data-demo="${name}"]`)!
        .previousElementSibling as HTMLElement
      before.setAttribute('tabindex', '-1')
      before.focus()
    }, name)
  }

  const focusKind = (page: Page, name: string) =>
    page.evaluate((name) => {
      const el = document.activeElement as HTMLElement | null
      const box = document.querySelector(`[data-demo="${name}"]`)!
      if (!el || !box.contains(el)) return 'outside'
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return 'zero-size'
      if (el.closest('.bl-pagination')) return 'page'
      if (el.classList.contains('bl-table__action')) return 'action'
      if (el.classList.contains('bl-table__sort')) return 'sort'
      return 'other'
    }, name)

  test('Tab reaches sort buttons, then row links, then pagination', async ({ page }) => {
    await focusBefore(page, 'table-default')
    const kinds: string[] = []
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab')
      const kind = await focusKind(page, 'table-default')
      if (kind === 'outside' && kinds.length) break
      if (kinds.at(-1) !== kind) kinds.push(kind)
    }
    expect(kinds).toEqual(['sort', 'action', 'page'])
  })

  test('Enter on a sort button changes aria-sort', async ({ page }) => {
    await focusBefore(page, 'table-default')
    await page.keyboard.press('Tab')
    expect(await focusKind(page, 'table-default')).toBe('sort')
    const sorted = demo(page, 'table-default').locator('th[aria-sort]')
    await expect(sorted).toHaveCount(0)
    await page.keyboard.press('Enter')
    await expect(sorted).toHaveCount(1)
    await expect(sorted).toHaveAttribute('aria-sort', 'ascending')
    await page.keyboard.press('Enter')
    await expect(sorted).toHaveAttribute('aria-sort', 'descending')
  })

  test('Enter on a pagination button changes the first visible row', async ({ page }) => {
    await page.goto('/')
    const first = demo(page, 'table-default').locator('tbody tr:first-child > :first-child')
    const before = await first.textContent()
    const next = demo(page, 'table-default').locator('.bl-pagination__next')
    await next.focus()
    await page.keyboard.press('Enter')
    await expect(first).not.toHaveText(before!)
    // the page-change announcement lands in the polite live region
    await expect(
      demo(page, 'table-default').locator('.bl-pagination [aria-live="polite"]')
    ).toHaveText(/6.10 of 12/)
  })

  test('Next keeps focus and stays disabled on the last page', async ({ page }) => {
    await page.goto('/')
    const next = demo(page, 'table-default').locator('.bl-pagination__next')
    await next.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    await page.keyboard.press('Enter')
    await expect(next).toBeFocused()
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    await expect(demo(page, 'table-default').locator('.bl-pagination [aria-live]')).toHaveText(
      /11.12 of 12/
    )
  })

  test('the stacked card is keyboard-reachable through the sort strip', async ({ page }) => {
    await focusBefore(page, 'table-narrow')
    await expect(demo(page, 'table-narrow').locator('.bl-table')).toHaveAttribute(
      'data-stacked',
      ''
    )
    const count = await demo(page, 'table-narrow')
      .locator('.bl-table__sort-strip .bl-table__sort')
      .count()
    expect(count).toBe(2)
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab')
      expect(await focusKind(page, 'table-narrow')).toBe('sort')
      const inStrip = await page.evaluate(
        () => !!document.activeElement?.closest('.bl-table__sort-strip')
      )
      expect(inStrip).toBe(true)
    }
  })

  test('a plain row click forwards to the row link in an overflowing scroll table', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const scroller = demo(page, 'table-scroll').locator('.bl-table__scroller')
    await expect(scroller).toHaveAttribute('tabindex', '0')
    await page.evaluate(() => {
      history.replaceState(null, '', '#tables')
    })
    await demo(page, 'table-scroll').locator('tbody tr:nth-child(2) td').nth(1).click()
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#scroll-row')
  })

  test('the pagination live region updates after Next', async ({ page }) => {
    await page.goto('/')
    const live = demo(page, 'table-default').locator('.bl-pagination [aria-live="polite"]')
    await demo(page, 'table-default').locator('.bl-pagination__next').click()
    await expect(live).toHaveText(/6.10 of 12/)
  })
})

test.describe('themed scrollbars', () => {
  const read = () => {
    const style = getComputedStyle(document.querySelector('pre.bl-log')!)
    return { width: style.scrollbarWidth, color: style.scrollbarColor }
  }

  test('the log scrollbar is thin and themed in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    const { width, color } = await page.evaluate(read)
    expect(width).toBe('thin')
    // --bl-control-border (#69707a) thumb on a transparent track.
    expect(color).toBe('rgb(105, 112, 122) rgba(0, 0, 0, 0)')
  })

  test.describe('forced colors', () => {
    test.use({ forcedColors: 'active' })
    test('the log keeps the system scrollbar colours', async ({ page }) => {
      await page.goto('/')
      expect((await page.evaluate(read)).color).toBe('auto')
    })
  })
})

test.describe('BlSelect chevron', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`the themed chevron is drawn and inset 16px (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/')
      const wrap = page.locator('.bl-select-wrap').first()
      await wrap.scrollIntoViewIfNeeded()
      const style = await wrap.evaluate((el) => {
        const s = getComputedStyle(el, '::after')
        return { right: s.right, width: s.width, bg: s.backgroundColor, mask: s.maskImage }
      })
      expect(style.right).toBe('16px')
      expect(style.width).toBe('10px')
      expect(style.mask).not.toBe('none')
      const box = (await wrap.boundingBox())!
      // The chevron's box is 10px wide, 16px inside the border edge; border is 1px.
      const clip = { x: box.x + box.width - 26, y: box.y, width: 10, height: box.height }
      const withChevron = await page.screenshot({ clip })
      await page.addStyleTag({ content: '.bl-select-wrap::after { display: none !important }' })
      const without = await page.screenshot({ clip })
      expect(withChevron.equals(without)).toBe(false)
    })
  }

  test.describe('forced colors', () => {
    test.use({ forcedColors: 'active' })
    test('the chevron stays visible', async ({ page }) => {
      await page.goto('/')
      const wrap = page.locator('.bl-select-wrap').first()
      await wrap.scrollIntoViewIfNeeded()
      const bg = await wrap.evaluate((el) => getComputedStyle(el, '::after').backgroundColor)
      expect(bg).not.toBe('rgba(0, 0, 0, 0)')
      const box = (await wrap.boundingBox())!
      const clip = { x: box.x + box.width - 26, y: box.y, width: 10, height: box.height }
      const withChevron = await page.screenshot({ clip })
      await page.addStyleTag({ content: '.bl-select-wrap::after { display: none !important }' })
      expect((await page.screenshot({ clip })).equals(withChevron)).toBe(false)
    })
  })
})

test('no axe violations with a dialog open', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-demo="dialog"]').getByRole('button', { name: 'Rename' }).click()
  const results = await new AxeBuilder({ page }).include('.bl-dialog[open]').analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

test('no axe violations with three toasts visible', async ({ page }) => {
  await page.goto('/')
  const t = page.locator('[data-demo="toast"]')
  for (const name of ['Toast', 'Success', 'With action'])
    await t.getByRole('button', { name }).click()
  await expect(page.locator('.bl-toast')).toHaveCount(3)
  const results = await new AxeBuilder({ page }).include('.bl-toaster').analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

test.describe('forced colors: v0.6 blocks', () => {
  test.use({ forcedColors: 'active' })
  test('dialog, toast, disclosure and toggle keep visible edges and marks', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-demo="toast"]').getByRole('button', { name: 'Success' }).click()
    // Chromium forces opaque fills to Canvas, so compare against the page ground, not transparent.
    const paints = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => {
          const ground = getComputedStyle(document.body).backgroundColor
          return getComputedStyle(el).backgroundColor !== ground
        })
    expect(await paints('.bl-toast__mark')).toBe(true)
    expect(await paints('.bl-disclosure__chevron')).toBe(true)
    const [on, off] = await page
      .locator('[data-demo="toggle"] .bl-toggle__track')
      .evaluateAll((els) => els.slice(0, 2).map((el) => getComputedStyle(el).backgroundColor))
    expect(on, 'checked and unchecked toggle tracks differ').not.toBe(off)
    await page.locator('[data-demo="dialog"]').getByRole('button', { name: 'Rename' }).click()
    const [edge, text] = await page
      .locator('.bl-dialog[open] .bl-dialog__panel')
      .evaluate((el) => [
        getComputedStyle(el).borderTopColor,
        getComputedStyle(document.body).color
      ])
    // Forced colors forces borders anyway; this checks the edge is visible, not that the rule exists.
    expect(edge).toBe(text) // CanvasText
    // axe reads the author colours, not the system palette that forced colors applies (the
    // computed colours above are black on white), so its contrast rule is a false positive here.
    const axe = await new AxeBuilder({ page })
      .include('.bl-dialog[open]')
      .disableRules(['color-contrast'])
      .analyze()
    expect(axe.violations.map((v) => v.id)).toEqual([])
  })
})

test('aria-current="location" markup is styled like the current page', async ({ page }) => {
  await page.goto('/')
  const colours = await page.evaluate(() => {
    const host = document.body.appendChild(document.createElement('div'))
    host.innerHTML =
      '<a class="bl-site-bar__link" href="#" aria-current="location">here</a>' +
      '<a class="bl-site-bar__link" href="#" aria-current="false">off</a>' +
      '<a class="bl-site-bar__link" href="#">plain</a>'
    const colour = (el: Element) => getComputedStyle(el).color
    const [here, off, plain] = [...host.children].map(colour)
    host.remove()
    return { here, off, plain }
  })
  expect(colours.here).not.toBe(colours.plain)
  expect(colours.off).toBe(colours.plain)
})
