import { expect, test, type Page } from '@playwright/test'

// Behaviour only (no screenshots): a native form.reset() restores the value each control had
// when it mounted, in the DOM and in the v-model.

const state = async (page: Page) =>
  JSON.parse((await page.locator('[data-state]').textContent()) ?? '{}') as Record<string, unknown>

test('form.reset() restores the mount-time value of every control', async ({ page }, testInfo) => {
  // Firefox and WebKit run it too (playwright.config.ts); in Chromium one project is enough.
  test.skip(
    ['desktop-dark', 'mobile-light', 'mobile-dark'].includes(testInfo.project.name),
    'one Chromium project is enough'
  )
  await page.goto('/reset.html')
  const text = page.getByRole('textbox', { name: 'Text', exact: true })
  const choice = page.getByRole('combobox', { name: 'Choice' })
  const level = page.getByRole('slider', { name: 'Level' })
  const count = page.getByRole('spinbutton', { name: 'Count' })
  const note = page.getByRole('textbox', { name: 'Note' })
  const outside = page.getByRole('textbox', { name: 'Outside' })

  await text.fill('changed')
  await choice.selectOption('c')
  await level.fill('90')
  await count.fill('42')
  await note.fill('other')
  await outside.fill('moved')
  await page.getByRole('radiogroup', { name: 'Segment', exact: true }).getByText('A').click()
  await page.getByRole('radiogroup', { name: 'Segment outside' }).getByText('A').click()
  await expect
    .poll(() => state(page))
    .toEqual({
      text: 'changed',
      choice: 'c',
      level: 90,
      count: 42,
      note: 'other',
      seg: 'a',
      outside: 'moved',
      segOutside: 'a'
    })

  // The controls write their models a task after the reset, one by one, so poll the whole state.
  await page.evaluate(() => (document.getElementById('reset-form') as HTMLFormElement).reset())

  await expect
    .poll(() => state(page))
    .toEqual({
      text: 'hello',
      choice: 'b',
      level: 30,
      count: 7,
      note: 'memo',
      seg: 'c',
      outside: 'away',
      segOutside: 'b'
    })
  await expect(text).toHaveValue('hello')
  await expect(choice).toHaveValue('b')
  await expect(level).toHaveValue('30')
  await expect(count).toHaveValue('7')
  await expect(note).toHaveValue('memo')
  await expect(outside).toHaveValue('away')
})
