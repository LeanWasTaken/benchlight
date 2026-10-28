import { expect, test, type Page } from '@playwright/test'

const demo = (page: Page) => page.locator('[data-demo="number-field"]')
const offset = (page: Page) => demo(page).getByRole('spinbutton', { name: 'Offset', exact: true })
const channel = (page: Page) => demo(page).getByRole('spinbutton', { name: 'Channel', exact: true })
const state = (page: Page) => page.locator('[data-demo="number-field-state"]')

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await demo(page).scrollIntoViewIfNeeded()
})

test('renders a labelled number input with the field wiring', async ({ page }) => {
  await expect(offset(page)).toHaveAttribute('type', 'number')
  await expect(offset(page)).toHaveValue('2')
  await expect(offset(page)).toHaveAttribute('min', '0')
  await expect(offset(page)).toHaveAccessibleDescription('Zero or more, step 0.5.')
  await expect(demo(page).getByRole('spinbutton', { name: 'Retries (locked)' })).toBeDisabled()
})

test('typing -5 then Tab with min 0 leaves 0', async ({ page }) => {
  await offset(page).fill('')
  await offset(page).pressSequentially('-5')
  await expect(state(page)).toHaveText('-5')
  await page.keyboard.press('Tab')
  await expect(offset(page)).not.toBeFocused()
  await expect(offset(page)).toHaveValue('0')
  await expect(state(page)).toHaveText('0')
})

test('Enter commits and clamps to max', async ({ page }) => {
  await channel(page).fill('')
  await channel(page).pressSequentially('40')
  await page.keyboard.press('Enter')
  await expect(channel(page)).toHaveValue('13')
  await expect(channel(page)).toBeFocused()
})

test('typing - keeps the - visible while the model is empty', async ({ page }) => {
  // Replace the 2 so the model changes (2 -> null) while "-" is on screen.
  await offset(page).selectText()
  await offset(page).pressSequentially('-')
  await expect(state(page)).toHaveText('null')
  // A number input reports "" for unparsable text, so read what is on screen via the selection.
  const shown = await offset(page).evaluate((el: HTMLInputElement) => {
    el.select()
    return document.getSelection()?.toString() ?? ''
  })
  expect(shown).toBe('-')
  expect(await offset(page).evaluate((el: HTMLInputElement) => el.validity.badInput)).toBe(true)
  // Collapse the selection to the end, then carry on typing after the kept "-".
  await page.keyboard.press('ArrowRight')
  await offset(page).pressSequentially('3')
  await expect(state(page)).toHaveText('-3')
  await expect(offset(page)).toHaveValue('-3')
})

test('typed text with a trailing zero is not rewritten while focused', async ({ page }) => {
  await offset(page).fill('')
  await offset(page).pressSequentially('1.50')
  await expect(state(page)).toHaveText('1.5')
  await expect(offset(page)).toHaveValue('1.50')
})

test('the wheel over the focused field blurs it and does not change the value', async ({
  page
}) => {
  await offset(page).click()
  await expect(offset(page)).toBeFocused()
  const box = (await offset(page).boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  const before = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, -100)
  await expect(offset(page)).not.toBeFocused()
  // The wheel still scrolls the page (it is not blocked), and it has been handled by now.
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(before)
  await expect(offset(page)).toHaveValue('2')
  await expect(state(page)).toHaveText('2')
})

test('leaving the field with only - clears it to match the empty model', async ({ page }) => {
  await offset(page).selectText()
  await offset(page).pressSequentially('-')
  await page.keyboard.press('Tab')
  await expect(state(page)).toHaveText('null')
  expect(await offset(page).evaluate((el: HTMLInputElement) => el.validity.badInput)).toBe(false)
  await expect(offset(page)).toHaveValue('')
})
