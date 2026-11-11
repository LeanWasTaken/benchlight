import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { defineComponent, h, nextTick, ref, type Component } from 'vue'
import BlTabs from '../../vue/components/BlTabs.vue'
import type { TabItem } from '../../vue/types'

const items: TabItem<string>[] = [
  { value: 'over view', label: 'Overview' },
  { value: 'logs', label: 'Logs' },
  { value: 'off', label: 'Off', disabled: true },
  { value: 'settings', label: 'Settings' }
]

const panels = (list: TabItem[] = items) =>
  Object.fromEntries(list.map((item) => [`panel-${item.value}`, () => `Body ${item.label}`]))

let warnSpy: MockInstance<typeof console.warn>
const mounted: VueWrapper[] = []
beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

function setup(
  props: Record<string, unknown> = {},
  slots: Record<string, unknown> = panels(),
  attachTo: Element = document.body
) {
  const w = mount(BlTabs as Component, {
    props: { items, ariaLabel: 'Sections', ...props },
    slots: slots as never,
    attachTo
  })
  mounted.push(w)
  return w
}

const tabs = (w: VueWrapper) => w.findAll<HTMLButtonElement>('[role=tab]')
const panelEls = (w: VueWrapper) => w.findAll<HTMLElement>('[role=tabpanel]')
const selected = (w: VueWrapper) => tabs(w).map((t) => t.attributes('aria-selected'))
const key = (el: Element, k: string, mods: KeyboardEventInit = {}) =>
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...mods })
  )
const warnings = (): string[] => warnSpy.mock.calls.map((c) => String(c[0]))

describe('BlTabs', () => {
  it('renders the tablist, tabs and panels with the documented markup', () => {
    const w = setup()
    expect(w.classes()).toContain('bl-tabs')
    const list = w.get('.bl-tabs > .bl-tabs__list')
    expect(list.attributes('role')).toBe('tablist')
    expect(list.attributes('aria-label')).toBe('Sections')
    const t = tabs(w)
    expect(t).toHaveLength(4)
    for (const tab of t) {
      expect(tab.element.tagName).toBe('BUTTON')
      expect(tab.classes()).toContain('bl-tabs__tab')
      expect(tab.attributes('type')).toBe('button')
    }
    expect(t.map((tab) => tab.text())).toEqual(['Overview', 'Logs', 'Off', 'Settings'])
    expect(t[2]!.attributes('disabled')).toBeDefined()
    const p = panelEls(w)
    expect(p).toHaveLength(4)
    for (const panel of p) expect(panel.classes()).toContain('bl-tabs__panel')
    expect(p[0]!.text()).toBe('Body Overview')
  })

  it('links tabs and panels with ids from useId, never from the value', () => {
    const w = setup()
    const t = tabs(w)
    const p = panelEls(w)
    const ids = new Set<string>()
    t.forEach((tab, i) => {
      const tabId = tab.attributes('id')!
      const panelId = p[i]!.attributes('id')!
      expect(tabId).toBeTruthy()
      expect(panelId).toBeTruthy()
      expect(tabId).not.toMatch(/\s/)
      expect(panelId).not.toMatch(/\s/)
      expect(tabId).not.toContain(String(items[i]!.value))
      expect(panelId).not.toContain(String(items[i]!.value))
      expect(tab.attributes('aria-controls')).toBe(panelId)
      expect(p[i]!.attributes('aria-labelledby')).toBe(tabId)
      ids.add(tabId).add(panelId)
    })
    expect(ids.size).toBe(8)
  })

  it('gives two instances in one app distinct ids', () => {
    const one = () => h(BlTabs as Component, { items, ariaLabel: 'Sections' }, panels())
    const w = mount(defineComponent({ render: () => h('div', [one(), one()]) }))
    mounted.push(w)
    const ids = w.findAll('[role=tab], [role=tabpanel]').map((el) => el.attributes('id'))
    expect(new Set(ids).size).toBe(16)
  })

  it('marks only the selected tab with aria-selected and tabindex 0', () => {
    const w = setup({ modelValue: 'logs' })
    expect(selected(w)).toEqual(['false', 'true', 'false', 'false'])
    expect(tabs(w).map((t) => t.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1'])
  })

  it('renders every panel and hides the inactive ones', () => {
    const w = setup({ modelValue: 'logs' })
    const hidden = panelEls(w).map((p) => p.attributes('hidden') !== undefined)
    expect(hidden).toEqual([true, false, true, true])
    expect(panelEls(w)[0]!.text()).toBe('Body Overview')
  })

  it('makes a panel focusable only when it holds no focusable element', async () => {
    const w = setup(
      {},
      {
        ...panels(),
        'panel-logs': () => h('button', { type: 'button' }, 'Clear'),
        'panel-settings': () => h('a', { href: '#x' }, 'More')
      }
    )
    await nextTick()
    expect(panelEls(w).map((p) => p.attributes('tabindex'))).toEqual([
      '0',
      undefined,
      '0',
      undefined
    ])
  })

  it('shows the first enabled item when the model is unset, without emitting', () => {
    const w = setup({ 'onUpdate:modelValue': () => {} })
    expect(selected(w)).toEqual(['true', 'false', 'false', 'false'])
    expect(tabs(w).map((t) => t.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('shows the first enabled item when the model names a missing or disabled item, without emitting', () => {
    const missing = setup({ modelValue: 'nope' })
    expect(selected(missing)).toEqual(['true', 'false', 'false', 'false'])
    expect(missing.emitted('update:modelValue')).toBeUndefined()
    const disabled = setup({
      modelValue: 'off',
      items: [{ value: 'z', label: 'Z', disabled: true }, ...items]
    })
    expect(selected(disabled)).toEqual(['false', 'true', 'false', 'false', 'false'])
    expect(disabled.emitted('update:modelValue')).toBeUndefined()
  })

  it('follows the model when it names an enabled item', async () => {
    const w = setup({ modelValue: 'logs' })
    expect(selected(w)).toEqual(['false', 'true', 'false', 'false'])
    await w.setProps({ modelValue: 'settings' })
    expect(selected(w)).toEqual(['false', 'false', 'false', 'true'])
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('keeps a valid model without emitting', () => {
    const w = setup({ modelValue: 'settings' })
    expect(selected(w)).toEqual(['false', 'false', 'false', 'true'])
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('shows the first enabled item when items change and the selected tab disappears, without emitting', async () => {
    const Host = defineComponent({
      setup() {
        const model = ref<string | number>('settings')
        const list = ref<TabItem[]>(items)
        return { model, list }
      },
      render() {
        return h('div', [
          h(
            BlTabs as Component,
            {
              items: this.list,
              ariaLabel: 'Sections',
              modelValue: this.model,
              'onUpdate:modelValue': (v: string) => (this.model = v)
            },
            panels()
          ),
          h('output', String(this.model))
        ])
      }
    })
    const w = mount(Host, { attachTo: document.body })
    mounted.push(w)
    expect(w.get('output').text()).toBe('settings')
    ;(w.vm as unknown as { list: TabItem[] }).list = [
      { value: 'off', label: 'Off', disabled: true },
      { value: 'logs', label: 'Logs' }
    ]
    await nextTick()
    await nextTick()
    expect(w.get('output').text()).toBe('settings')
    expect(w.findComponent(BlTabs as Component).emitted('update:modelValue')).toBeUndefined()
    expect(w.findAll('[role=tab]').map((t) => t.attributes('aria-selected'))).toEqual([
      'false',
      'true'
    ])
  })

  it('selects nothing and does not throw when every item is disabled', () => {
    const all = items.map((i) => ({ ...i, disabled: true }))
    const w = setup({ items: all, 'onUpdate:modelValue': () => {} }, panels(all))
    expect(selected(w)).toEqual(['false', 'false', 'false', 'false'])
    expect(panelEls(w).every((p) => p.attributes('hidden') !== undefined)).toBe(true)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('works with number values', () => {
    const list = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' }
    ]
    const w = setup({ items: list, modelValue: 2 }, panels(list))
    expect(selected(w)).toEqual(['false', 'true'])
    expect(panelEls(w)[1]!.text()).toBe('Body Two')
  })

  it('selects on click', async () => {
    const w = setup({ modelValue: 'over view' })
    await tabs(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['logs'])
    expect(selected(w)).toEqual(['false', 'true', 'false', 'false'])
  })

  describe('dev warnings', () => {
    it('warns when ariaLabel is missing', () => {
      setup({ ariaLabel: undefined })
      expect(warnings().some((m) => m.includes('BlTabs') && m.includes('ariaLabel'))).toBe(true)
    })

    it('does not warn with ariaLabel and a panel per item', () => {
      setup()
      expect(warnings().filter((m) => m.includes('BlTabs'))).toEqual([])
    })

    it('warns on duplicate values', () => {
      const dup = [...items, { value: 'logs', label: 'Logs again' }]
      setup({ items: dup }, panels(dup))
      expect(warnings().some((m) => m.includes('BlTabs') && m.includes('duplicate'))).toBe(true)
    })

    it('keeps Vue keys unique with duplicate values, so updates patch cleanly', async () => {
      const dup = [...items, { value: 'logs', label: 'Logs again' }]
      const w = setup({ items: dup }, panels(dup))
      await w.setProps({ items: [...dup].reverse() })
      expect(warnings().filter((m) => /duplicate keys/i.test(m))).toEqual([])
      expect(tabs(w).map((t) => t.text())).toEqual([
        'Logs again',
        'Settings',
        'Off',
        'Logs',
        'Overview'
      ])
    })

    it('warns for an item without a panel slot', () => {
      const rest = panels()
      delete rest['panel-logs']
      setup({}, rest)
      expect(warnings().some((m) => m.includes('BlTabs') && m.includes('panel-logs'))).toBe(true)
    })
  })

  describe('keyboard', () => {
    it('moves focus with ArrowRight/ArrowLeft, wrapping and skipping disabled tabs', async () => {
      const w = setup({ modelValue: 'logs', activation: 'manual' })
      const t = tabs(w).map((x) => x.element)
      t[1]!.focus()
      key(t[1]!, 'ArrowRight')
      await nextTick()
      expect(document.activeElement).toBe(t[3])
      key(t[3]!, 'ArrowRight')
      await nextTick()
      expect(document.activeElement).toBe(t[0])
      key(t[0]!, 'ArrowLeft')
      await nextTick()
      expect(document.activeElement).toBe(t[3])
      key(t[3]!, 'ArrowLeft')
      await nextTick()
      expect(document.activeElement).toBe(t[1])
    })

    it('reverses the arrows under dir="rtl" on an ancestor', async () => {
      const host = document.createElement('div')
      host.setAttribute('dir', 'rtl')
      document.body.append(host)
      const w = setup({ modelValue: 'logs', activation: 'manual' }, panels(), host)
      const t = tabs(w).map((x) => x.element)
      t[1]!.focus()
      key(t[1]!, 'ArrowLeft')
      await nextTick()
      expect(document.activeElement).toBe(t[3])
      key(t[3]!, 'ArrowRight')
      await nextTick()
      expect(document.activeElement).toBe(t[1])
    })

    it('Home and End go to the first and last enabled tabs', async () => {
      const list = [{ value: 'x', label: 'X', disabled: true }, ...items.slice(0, 3)]
      const w = setup({ items: list, modelValue: 'logs', activation: 'manual' }, panels(list))
      const t = tabs(w).map((x) => x.element)
      t[2]!.focus()
      key(t[2]!, 'Home')
      await nextTick()
      expect(document.activeElement).toBe(t[1])
      key(t[1]!, 'End')
      await nextTick()
      expect(document.activeElement).toBe(t[2])
    })

    it('prevents the default action of handled keys only', () => {
      const w = setup()
      const t = tabs(w)[0]!.element
      t.focus()
      expect(key(t, 'ArrowRight')).toBe(false)
      expect(key(t, 'a')).toBe(true)
      expect(key(t, 'ArrowDown')).toBe(true)
    })

    it.each([
      ['altKey', 'ArrowRight'],
      ['altKey', 'Home'],
      ['ctrlKey', 'ArrowRight'],
      ['ctrlKey', 'Home'],
      ['metaKey', 'ArrowRight'],
      ['metaKey', 'Home'],
      ['shiftKey', 'ArrowRight'],
      ['shiftKey', 'End']
    ])('leaves %s+%s to the browser', async (mod, k) => {
      const w = setup({ modelValue: 'logs' })
      const t = tabs(w).map((x) => x.element)
      t[1]!.focus()
      expect(key(t[1]!, k, { [mod]: true })).toBe(true)
      await nextTick()
      expect(document.activeElement).toBe(t[1])
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(selected(w)).toEqual(['false', 'true', 'false', 'false'])
    })

    it.each(['Enter', ' '])('manual activation ignores Shift+%j', async (k) => {
      const w = setup({ modelValue: 'over view', activation: 'manual' })
      const t = tabs(w).map((x) => x.element)
      t[0]!.focus()
      key(t[0]!, 'ArrowRight')
      await nextTick()
      expect(key(t[1]!, k, { shiftKey: true })).toBe(true)
      await nextTick()
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(selected(w)).toEqual(['true', 'false', 'false', 'false'])
    })

    it('auto activation selects the tab focus moves to', async () => {
      const w = setup({ modelValue: 'over view' })
      const t = tabs(w).map((x) => x.element)
      t[0]!.focus()
      key(t[0]!, 'ArrowRight')
      await nextTick()
      expect(document.activeElement).toBe(t[1])
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['logs'])
      expect(selected(w)).toEqual(['false', 'true', 'false', 'false'])
      key(t[1]!, 'End')
      await nextTick()
      expect(selected(w)).toEqual(['false', 'false', 'false', 'true'])
    })

    it('manual activation selects only on Enter or Space', async () => {
      const w = setup({ modelValue: 'over view', activation: 'manual' })
      const t = tabs(w).map((x) => x.element)
      t[0]!.focus()
      key(t[0]!, 'ArrowRight')
      await nextTick()
      expect(document.activeElement).toBe(t[1])
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(selected(w)).toEqual(['true', 'false', 'false', 'false'])
      key(t[1]!, 'Enter')
      await nextTick()
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['logs'])
      key(t[1]!, 'ArrowRight')
      await nextTick()
      key(t[3]!, ' ')
      await nextTick()
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['settings'])
      expect(selected(w)).toEqual(['false', 'false', 'false', 'true'])
    })
  })
})
