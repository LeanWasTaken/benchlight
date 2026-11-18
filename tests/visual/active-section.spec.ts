import { expect, test, type Page } from '@playwright/test'

const SECTIONS = ['tokens', 'controls', 'forms', 'readouts', 'content', 'tables', 'blocks', 'hooks']
const TABS = ['tokens', 'controls', 'tables', 'blocks']

const siteLink = (page: Page, id: string) => page.locator(`.bl-site-bar a[href="#${id}"]`)
const tabLink = (page: Page, id: string) => page.locator(`.bl-tab-bar a[href="#${id}"]`)
const current = (page: Page, selector: string) =>
  page.locator(`${selector}[aria-current]:not([aria-current="false"])`)

// instant jumps, so the assertion does not race a smooth scroll
const jump = (page: Page, id: string) =>
  page.evaluate((target) => {
    document.documentElement.style.scrollBehavior = 'auto'
    const top = document.getElementById(target)!.getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, top - 56)
  }, id)

test('the site bar highlights the section being read, one at a time', async ({ page }) => {
  await page.goto('/')
  await expect(siteLink(page, 'tokens')).toHaveAttribute('aria-current', 'page')
  for (const id of SECTIONS.slice(1, -1)) {
    await jump(page, id)
    await expect(siteLink(page, id)).toHaveAttribute('aria-current', 'page')
    await expect(current(page, '.bl-site-bar a')).toHaveCount(1)
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect(siteLink(page, 'hooks')).toHaveAttribute('aria-current', 'page')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(siteLink(page, 'tokens')).toHaveAttribute('aria-current', 'page')
})

test('clicking a site bar link makes it current', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'), 'the site bar links are not shown')
  await page.goto('/')
  await siteLink(page, 'blocks').click()
  await expect(siteLink(page, 'blocks')).toHaveAttribute('aria-current', 'page')
  await expect(current(page, '.bl-site-bar a')).toHaveCount(1)
  await page.goto('/#tables')
  await expect(siteLink(page, 'tables')).toHaveAttribute('aria-current', 'page')
})

test('the tab bar follows on mobile', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'the tab bar is mobile only')
  await page.goto('/')
  await expect(tabLink(page, 'tokens')).toHaveAttribute('aria-current', 'page')
  for (const id of TABS.slice(1)) {
    await jump(page, id)
    await expect(tabLink(page, id)).toHaveAttribute('aria-current', 'page')
    await expect(current(page, '.bl-tab-bar a')).toHaveCount(1)
  }
  await tabLink(page, 'controls').click()
  await expect(tabLink(page, 'controls')).toHaveAttribute('aria-current', 'page')
})
