import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

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
  const bar = await page.locator('.bl-tabbar').boundingBox()
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
    '.bl-segmented__item:has(:checked)'
  ]) {
    test(`${selector} stays visible`, async ({ page }) => {
      await page.goto('/')
      expect(await page.evaluate(visible, { selector })).toBe(true)
    })
  }

  test('the ok message dot stays visible', async ({ page }) => {
    await page.goto('/')
    const dot = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector('.bl-msg--ok')!, '::before')
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
      '.bl-switch__option',
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
