import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import BlIndexRow from '../../vue/components/BlIndexRow.vue'
import BlNavLink from '../../vue/components/BlNavLink.vue'
import BlTableOf from '../../vue/components/BlTable.vue'
import BlToaster from '../../vue/components/BlToaster.vue'
import { resetToastStore } from '../../vue/internal/toastStore'

// Loose rows: these tests mount with ad hoc keys, which the inferred row type would reject.
const BlTable = BlTableOf<Record<string, unknown>>

const forwarded = {
  target: '_blank',
  rel: 'noopener',
  'data-track': 'nav',
  'aria-label': 'Docs',
  class: 'mine',
  style: 'margin: 1px'
}

describe.each([
  ['BlNavLink', BlNavLink, 'a.bl-site-bar__link', {}],
  ['BlIndexRow', BlIndexRow, 'a.bl-index-row', { title: 't' }]
] as const)('%s attribute forwarding', (_name, Comp, link, slots) => {
  const make = (onClick?: (e: Event) => void) =>
    mount(Comp, {
      props: { href: '/x' },
      attrs: { ...forwarded, ...(onClick ? { onClick } : {}) },
      slots: Object.fromEntries(Object.entries(slots).map(([k, v]) => [k, () => v])) as never
    })

  it('puts target, rel, data-* and aria-label on the link, not the li', () => {
    const w = make()
    const a = w.get(link)
    expect(a.attributes()).toMatchObject({
      target: '_blank',
      rel: 'noopener',
      'data-track': 'nav',
      'aria-label': 'Docs'
    })
    const li = w.get('li')
    for (const attr of ['target', 'rel', 'data-track', 'aria-label'])
      expect(li.attributes(attr)).toBeUndefined()
  })

  it('keeps class and style on the li only', () => {
    const w = make()
    const li = w.get('li')
    expect(li.classes()).toContain('mine')
    expect(li.attributes('style')).toContain('margin')
    expect(w.get(link).classes()).not.toContain('mine')
    expect(w.get(link).attributes('style')).toBeUndefined()
  })

  it('delivers @click to the link', async () => {
    const onClick = vi.fn((e: Event) => e.preventDefault())
    const w = make(onClick)
    await w.get('li').trigger('click')
    expect(onClick).not.toHaveBeenCalled()
    await w.get(link).trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('BlToaster attributes', () => {
  afterEach(() => {
    resetToastStore()
    vi.restoreAllMocks()
  })

  it('binds class, data-* and aria-* to the section without a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(BlToaster, {
      attrs: { class: 'mine', 'data-testid': 'toaster', 'aria-live': 'off' },
      attachTo: document.body
    })
    await nextTick()
    const section = document.body.querySelector('section.bl-toaster')!
    expect(section.classList.contains('mine')).toBe(true)
    expect(section.getAttribute('data-testid')).toBe('toaster')
    expect(section.getAttribute('aria-live')).toBe('off')
    expect(section.getAttribute('aria-label')).toBe('Notifications')
    expect(
      warn.mock.calls.some((call) => String(call[0]).includes('Extraneous non-props attributes'))
    ).toBe(false)
    w.unmount()
  })
})

describe('BlToaster aria-label', () => {
  afterEach(() => {
    resetToastStore()
  })

  it('lets a consumer aria-label win over labels.region', async () => {
    const w = mount(BlToaster, {
      props: { labels: { region: 'From labels' } },
      attrs: { 'aria-label': 'Mine' },
      attachTo: document.body
    })
    await nextTick()
    expect(document.body.querySelector('section.bl-toaster')!.getAttribute('aria-label')).toBe(
      'Mine'
    )
    w.unmount()
  })
})

describe('BlTable attributes', () => {
  const columns = [{ key: 'name', label: 'Device' }]
  const rows = [{ name: 'Lamp' }]
  const make = (attrs: Record<string, unknown>) =>
    mount(BlTable, { props: { caption: 'Clients', columns, rows }, attrs })

  it('sends aria-* to the table and the rest to the wrapper', () => {
    const w = make({
      'aria-describedby': 'note',
      'aria-label': 'Clients',
      class: 'mine',
      'data-x': '1',
      id: 'tbl'
    })
    const table = w.get('table')
    expect(table.attributes('aria-describedby')).toBe('note')
    expect(table.attributes('aria-label')).toBe('Clients')
    expect(w.classes()).toContain('mine')
    expect(w.classes()).toContain('bl-table')
    expect(w.attributes('data-x')).toBe('1')
    expect(w.attributes('id')).toBe('tbl')
    expect(w.attributes('aria-describedby')).toBeUndefined()
    expect(w.attributes('aria-label')).toBeUndefined()
  })

  it('keeps aria-hidden, aria-busy and listeners on the wrapper', async () => {
    const onClick = vi.fn()
    const w = make({
      'aria-hidden': 'true',
      'aria-busy': 'true',
      'aria-roledescription': 'grid',
      onClick
    })
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.get('table').attributes('aria-hidden')).toBeUndefined()
    expect(w.get('table').attributes('aria-busy')).toBeUndefined()
    expect(w.get('table').attributes('aria-roledescription')).toBe('grid')
    await w.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
