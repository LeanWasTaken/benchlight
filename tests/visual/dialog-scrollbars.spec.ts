import { expect, test } from '@playwright/test'

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

const SHORT =
  'main > section:not(#blocks), #blocks > :not([data-demo="dialog"]) { display: none !important; }'

for (const length of ['long', 'short'] as const) {
  test(`opening a dialog does not shift a ${length} page`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light', 'one project is enough')
    await page.goto('/')
    if (length === 'short') await page.addStyleTag({ content: SHORT })
    const gutter = await page.evaluate(() => innerWidth - document.documentElement.clientWidth)
    if (length === 'long') expect(gutter, 'a classic scrollbar is present').toBeGreaterThan(0)
    else expect(gutter).toBe(0)
    const demo = page.locator('[data-demo="dialog"]')
    const x = () => demo.evaluate((el) => el.getBoundingClientRect().left)
    const before = await x()
    await demo.getByRole('button', { name: 'Rename' }).click()
    await expect(page.locator('.bl-dialog[open]')).toBeVisible()
    expect(await x()).toBeCloseTo(before, 0)
  })
}
