import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import BlDialog from '../../vue/components/BlDialog.vue'
import BlField from '../../vue/components/BlField.vue'
import BlInput from '../../vue/components/BlInput.vue'
import BlNumberField from '../../vue/components/BlNumberField.vue'
import BlPagination from '../../vue/components/BlPagination.vue'
import BlPopover from '../../vue/components/BlPopover.vue'
import BlRange from '../../vue/components/BlRange.vue'
import BlSegmented from '../../vue/components/BlSegmented.vue'
import BlSegmentedNav from '../../vue/components/BlSegmentedNav.vue'
import BlSelect from '../../vue/components/BlSelect.vue'
import { toastHosts } from '../../vue/internal/toastHosts'
import { addToast, resetToastStore, toastState } from '../../vue/internal/toastStore'
import { linkBindings } from '../../vue/internal/link'
import { ansiToSegments } from '../../vue/utils/ansi'

const proto = HTMLElement.prototype as unknown as Record<string, unknown>
afterEach(() => {
  delete proto['showPopover']
  delete proto['hidePopover']
  document.body.innerHTML = ''
  toastHosts.value = []
  resetToastStore()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('KeepAlive', () => {
  it('releases an open dialog on deactivation and restores it on activation', async () => {
    const shown = ref(true)
    const open = ref(true)
    const onClose = vi.fn()
    const Dlg = defineComponent({
      setup: () => () => h(BlDialog, { open: open.value, title: 'T', onClose })
    })
    const w = mount(
      defineComponent({
        setup: () => () => h(KeepAlive, null, () => (shown.value ? h(Dlg) : null))
      }),
      { attachTo: document.body }
    )
    await nextTick()
    const dialog = document.querySelector('dialog')!
    expect(dialog.open).toBe(true)
    expect(toastHosts.value).toHaveLength(1)

    shown.value = false
    await nextTick()
    expect(toastHosts.value).toHaveLength(0)
    expect(dialog.open).toBe(false)
    expect(onClose).not.toHaveBeenCalled()
    expect(document.documentElement.style.getPropertyValue('--bl-dialog-gutter')).toBe('')

    shown.value = true
    await nextTick()
    expect(dialog.open).toBe(true)
    expect(toastHosts.value).toHaveLength(1)
    w.unmount()
  })

  it('does not reopen a dialog whose open model went false while deactivated', async () => {
    const shown = ref(true)
    const open = ref(true)
    const Dlg = defineComponent({
      setup: () => () => h(BlDialog, { open: open.value, title: 'T' })
    })
    const w = mount(
      defineComponent({
        setup: () => () => h(KeepAlive, null, () => (shown.value ? h(Dlg) : null))
      }),
      { attachTo: document.body }
    )
    await nextTick()
    shown.value = false
    await nextTick()
    open.value = false
    await nextTick()
    shown.value = true
    await nextTick()
    expect(document.querySelector('dialog')!.open).toBe(false)
    expect(toastHosts.value).toHaveLength(0)
    w.unmount()
  })

  describe('popover', () => {
    async function setup() {
      const hide = vi.fn()
      const show = vi.fn()
      proto['showPopover'] = show
      proto['hidePopover'] = hide
      const shown = ref(true)
      const open = ref(false)
      const onUpdate = vi.fn((v: boolean) => (open.value = v))
      const Pop = defineComponent({
        setup: () => () =>
          h(
            BlPopover,
            { open: open.value, 'onUpdate:open': onUpdate },
            { trigger: ({ bind }: { bind: Record<string, unknown> }) => h('button', bind, 'x') }
          )
      })
      const w = mount(
        defineComponent({
          setup: () => () => h(KeepAlive, null, () => (shown.value ? h(Pop) : null))
        }),
        { attachTo: document.body }
      )
      const panel = document.querySelector('.bl-popover')!
      const e = new Event('beforetoggle')
      Object.assign(e, { newState: 'open', oldState: 'closed' })
      panel.dispatchEvent(e)
      await nextTick()
      expect(open.value).toBe(true)
      onUpdate.mockClear()
      // A deactivated branch is detached from the document, so keep the element.
      const button = document.querySelector('button')!
      const expanded = () => button.getAttribute('aria-expanded')
      return { w, shown, open, onUpdate, hide, show, expanded }
    }

    it('hides on deactivation without writing the open model, reopens on activation', async () => {
      const { w, shown, open, onUpdate, hide, show, expanded } = await setup()
      expect(expanded()).toBe('true')
      shown.value = false
      await nextTick()
      expect(hide).toHaveBeenCalled()
      expect(onUpdate).not.toHaveBeenCalled()
      expect(open.value).toBe(true)
      expect(expanded()).toBe('false')
      shown.value = true
      await nextTick()
      expect(show).toHaveBeenCalled()
      expect(expanded()).toBe('true')
      expect(onUpdate).not.toHaveBeenCalled()
      w.unmount()
    })

    it('stays closed when the model went false while deactivated', async () => {
      const { w, shown, open, show, expanded } = await setup()
      shown.value = false
      await nextTick()
      open.value = false
      await nextTick()
      shown.value = true
      await nextTick()
      expect(show).not.toHaveBeenCalled()
      expect(expanded()).toBe('false')
      w.unmount()
    })
  })
})

describe('toast durations', () => {
  beforeEach(() => {
    resetToastStore()
  })
  it.each([
    [Infinity, 0],
    [NaN, 0],
    [-5, 0],
    [0, 0],
    [2 ** 40, 2 ** 31 - 1],
    [1500, 1500]
  ])('normalises %s to %s', (input, expected) => {
    const id = addToast({ message: 'm', duration: input })
    expect(toastState.items.find((t) => t.id === id)!.duration).toBe(expected)
  })
})

describe('BlPagination range text', () => {
  it('uses the normalised page size', () => {
    const a = mount(BlPagination, { props: { total: 10, pageSize: 2.5, ariaLabel: 'p' } })
    expect(a.text()).toContain('1–2 of 10')
    const b = mount(BlPagination, { props: { total: 10, pageSize: 0, ariaLabel: 'p' } })
    expect(b.text()).toContain('1–1 of 10')
  })
})

describe('ansiToSegments', () => {
  it('drops non-SGR CSI sequences', () => {
    const segments = ansiToSegments('a\x1b[2Kb\x1b[1Ac')
    expect(segments.map((s) => s.text).join('')).toBe('abc')
    expect(ansiToSegments('\x1b[31mr\x1b[0m')).toEqual([{ text: 'r', className: 'bl-ansi-31' }])
  })
})

describe('BlField label target', () => {
  const cases: [string, () => ReturnType<typeof h>, string][] = [
    ['BlInput', () => h(BlInput, { id: 'email' }), 'input'],
    ['BlNumberField', () => h(BlNumberField, { id: 'email' }), 'input'],
    ['BlSelect', () => h(BlSelect, { id: 'email', options: [] }), 'select'],
    ['BlRange', () => h(BlRange, { id: 'email' }), 'input']
  ]
  it.each(cases)('%s keeps the field id and warns', (_n, child, sel) => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(BlField, { props: { label: 'Email' }, slots: { default: child } })
    expect(w.get(sel).attributes('id')).toBe(w.get('label').attributes('for'))
    expect(w.get(sel).attributes('id')).not.toBe('email')
    expect(warn).toHaveBeenCalled()
  })
  it('lets a control outside a field keep its id', () => {
    expect(
      mount(BlInput, { attrs: { id: 'x' } })
        .get('input')
        .attributes('id')
    ).toBe('x')
  })
})

describe('accessible-name warnings', () => {
  it('warns for an unnamed BlSegmented and BlSegmentedNav', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BlSegmented, { props: { options: [{ value: 'a', label: 'A' }] } })
    mount(BlSegmentedNav, { props: { items: [{ label: 'A', href: '/a' }] } })
    const text = warn.mock.calls.map((c) => String(c[0]))
    expect(text.some((t) => t.includes('BlSegmented: set `ariaLabel`'))).toBe(true)
    expect(text.some((t) => t.includes('BlSegmentedNav: set `ariaLabel`'))).toBe(true)
  })
  it('stays quiet when labelled', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BlSegmented, { props: { options: [], ariaLabel: 'x' } })
    mount(BlSegmentedNav, { props: { items: [] }, attrs: { 'aria-labelledby': 'l' } })
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('linkBindings warnings', () => {
  it('warns once per message, not per call', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (let i = 0; i < 3; i++) linkBindings('span', '/x')
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
