import { expect, test } from '@playwright/test'

test('playground renders every component', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  // Linux Chromium rounds a fractional page height up or down between captures, so clip the
  // full-page shot to a whole-pixel box.
  const { width, height } = await page.evaluate(() => {
    const box = document.documentElement.getBoundingClientRect()
    return { width: Math.floor(box.width), height: Math.floor(box.height) }
  })
  await expect(page).toHaveScreenshot('playground.png', {
    fullPage: true,
    clip: { x: 0, y: 0, width, height }
  })
})

test('a saved choice opposite to the OS survives a reload', async ({ page }, testInfo) => {
  const opposite = testInfo.project.name.endsWith('dark') ? 'Light' : 'Dark'
  await page.goto('/')
  await page.getByRole('radio', { name: opposite }).check({ force: true })
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-bl-appearance', opposite.toLowerCase())
  // Block the app bundle so only the inline prepaint script can apply the choice.
  await page.route(/\/assets\/.*\.js$/, (route) => route.abort())
  await page.reload()
  await expect(html).toHaveAttribute('data-bl-appearance', opposite.toLowerCase())
  const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(canvas).toBe(opposite === 'Dark' ? 'rgb(16, 18, 20)' : 'rgb(239, 241, 243)')
})

test('the tab bar is pinned to the viewport bottom on mobile and hidden on desktop', async ({
  page
}, testInfo) => {
  await page.goto('/')
  const tabbar = page.locator('.bl-tabbar')
  if (testInfo.project.name.startsWith('mobile')) {
    await expect(tabbar).toBeVisible()
    const box = await tabbar.boundingBox()
    const height = page.viewportSize()?.height ?? 0
    expect(box).not.toBeNull()
    expect(height - (box!.y + box!.height)).toBeLessThan(16)
    expect(height - (box!.y + box!.height)).toBeGreaterThanOrEqual(-1)
  } else {
    await expect(tabbar).not.toBeVisible()
  }
})

test.describe('appearance switch on a reload with a saved choice', () => {
  // Motion is reduced project-wide; this check is about the transition, so allow it.
  test.use({ reducedMotion: 'no-preference' })

  test('settles on the saved choice without animating, and holds it until ready', async ({
    page
  }, testInfo) => {
    const saved = testInfo.project.name.endsWith('dark') ? 'light' : 'dark'
    const thumb = (selector: string) =>
      page.evaluate((sel) => {
        const style = getComputedStyle(document.querySelector(sel)!, '::before')
        return { transform: style.transform }
      }, selector)

    await page.addInitScript((value) => localStorage.setItem('bl-appearance', value), saved)
    await page.addInitScript(() => {
      const runs: string[] = []
      ;(window as unknown as { __thumbRuns: string[] }).__thumbRuns = runs
      document.addEventListener(
        'transitionrun',
        (event) => {
          if ((event.target as Element).closest('.bl-switch__track')) runs.push(event.propertyName)
        },
        true
      )
    })

    const final = saved === 'dark' ? 'matrix(1, 0, 0, 1, 88, 0)' : 'matrix(1, 0, 0, 1, 44, 0)'

    // With the app running, the thumb settles on the same spot and never transitions there.
    await page.goto('/')
    await expect(page.locator('.bl-switch').first()).toHaveAttribute('data-ready', '')
    expect((await thumb('.bl-switch__track')).transform).toBe(final)
    expect(
      await page.evaluate(() => (window as unknown as { __thumbRuns: string[] }).__thumbRuns)
    ).toEqual([])

    // Before the component reports ready the thumb follows the root attribute, not the radios.
    await page.evaluate(() => {
      document.querySelector<HTMLInputElement>('.bl-switch input[value="auto"]')!.checked = true
      document.querySelector('.bl-switch')!.removeAttribute('data-ready')
    })
    expect((await thumb('.bl-switch__track')).transform).toBe(final)
  })
})
