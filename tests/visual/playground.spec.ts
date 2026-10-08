import { expect, test } from '@playwright/test'

test('playground renders every component', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  // BlTable decides stacked/unstacked in an animation frame after fonts load; let it land.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )
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
  const tabBar = page.locator('.bl-tab-bar')
  if (testInfo.project.name.startsWith('mobile')) {
    await expect(tabBar).toBeVisible()
    const box = await tabBar.boundingBox()
    const height = page.viewportSize()?.height ?? 0
    expect(box).not.toBeNull()
    expect(height - (box!.y + box!.height)).toBeLessThan(16)
    expect(height - (box!.y + box!.height)).toBeGreaterThanOrEqual(-1)
  } else {
    await expect(tabBar).not.toBeVisible()
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
          if ((event.target as Element).closest('.bl-appearance__track'))
            runs.push(event.propertyName)
        },
        true
      )
    })

    const final = saved === 'dark' ? 'matrix(1, 0, 0, 1, 88, 0)' : 'matrix(1, 0, 0, 1, 44, 0)'

    // With the app running, the thumb settles on the same spot and never transitions there.
    await page.goto('/')
    await expect(page.locator('.bl-appearance').first()).toHaveAttribute('data-ready', '')
    expect((await thumb('.bl-appearance__track')).transform).toBe(final)
    expect(
      await page.evaluate(() => (window as unknown as { __thumbRuns: string[] }).__thumbRuns)
    ).toEqual([])

    // Before the component reports ready the thumb follows the root attribute, not the radios.
    await page.evaluate(() => {
      document.querySelector<HTMLInputElement>('.bl-appearance input[value="auto"]')!.checked = true
      document.querySelector('.bl-appearance')!.removeAttribute('data-ready')
    })
    expect((await thumb('.bl-appearance__track')).transform).toBe(final)
  })
})
