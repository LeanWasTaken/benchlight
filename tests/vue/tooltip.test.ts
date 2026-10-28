import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import BlTooltip from '../../vue/components/BlTooltip.vue'
import type { TooltipTriggerBind } from '../../vue/types'

// happy-dom has no popover API: stub the methods and track what the component asked for.
const proto = HTMLElement.prototype as unknown as Record<string, unknown>
let show: ReturnType<typeof vi.fn>
let hide: ReturnType<typeof vi.fn>
const mounted: VueWrapper[] = []
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubEnv('NODE_ENV', 'development')
  show = vi.fn()
  hide = vi.fn()
  proto['showPopover'] = show
  proto['hidePopover'] = hide
  proto['togglePopover'] = vi.fn()
})
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount()
  delete proto['showPopover']
  delete proto['hidePopover']
  delete proto['togglePopover']
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

const button = (attrs: Record<string, unknown> = {}) => ({
  trigger: ({ bind }: { bind: TooltipTriggerBind }) => h('button', { ...bind, ...attrs }, 'Save')
})

function setup(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const w = mount(BlTooltip, {
    props: { text: 'Save the draft', ...props },
    slots: button(attrs),
    attachTo: document.body
  })
  mounted.push(w)
  return { w, trigger: w.get('button').element as HTMLButtonElement, tip: w.get('.bl-tooltip') }
}

function pointer(el: Element, type: 'pointerenter' | 'pointerleave', pointerType = 'mouse') {
  const e = new Event(type)
  Object.assign(e, { pointerType })
  el.dispatchEvent(e)
}

function esc() {
  const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  document.dispatchEvent(e)
  return e
}

describe('BlTooltip', () => {
  it('renders a manual tooltip popover with the text, top/center by default', () => {
    const { tip } = setup()
    expect(tip.element.tagName).toBe('DIV')
    expect(tip.attributes('popover')).toBe('manual')
    expect(tip.attributes('role')).toBe('tooltip')
    expect(tip.attributes('data-side')).toBe('top')
    expect(tip.attributes('data-align')).toBe('center')
    expect(tip.text()).toBe('Save the draft')
  })

  it('passes side and align through', () => {
    const { tip } = setup({ side: 'end', align: 'start' })
    expect(tip.attributes('data-side')).toBe('end')
    expect(tip.attributes('data-align')).toBe('start')
  })

  it('points the trigger aria-describedby at the tooltip id', () => {
    const { trigger, tip } = setup()
    expect(tip.attributes('id')).toBeTruthy()
    expect(trigger.getAttribute('aria-describedby')).toBe(tip.attributes('id'))
  })

  it('anchors the tooltip to the trigger', () => {
    const { trigger, tip } = setup()
    const name = trigger.style.getPropertyValue('anchor-name')
    expect(name).toMatch(/^--bl-/)
    expect(tip.attributes('style')).toContain(name)
  })

  it('shows on pointer enter only after the default 400 ms delay', () => {
    const { trigger } = setup()
    pointer(trigger, 'pointerenter')
    vi.advanceTimersByTime(399)
    expect(show).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('honours a custom delay', () => {
    const { trigger } = setup({ delay: 100 })
    pointer(trigger, 'pointerenter')
    vi.advanceTimersByTime(99)
    expect(show).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('does not show when the pointer leaves before the delay', () => {
    const { trigger } = setup()
    pointer(trigger, 'pointerenter')
    vi.advanceTimersByTime(200)
    pointer(trigger, 'pointerleave')
    vi.advanceTimersByTime(1000)
    expect(show).not.toHaveBeenCalled()
  })

  it('hides after a 100 ms grace once the pointer leaves the trigger', () => {
    const { trigger } = setup()
    pointer(trigger, 'pointerenter')
    vi.advanceTimersByTime(400)
    pointer(trigger, 'pointerleave')
    vi.advanceTimersByTime(99)
    expect(hide).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(hide).toHaveBeenCalledTimes(1)
  })

  it('stays open when the pointer moves onto the tooltip within the grace', () => {
    const { trigger, tip } = setup()
    pointer(trigger, 'pointerenter')
    vi.advanceTimersByTime(400)
    pointer(trigger, 'pointerleave')
    vi.advanceTimersByTime(50)
    pointer(tip.element, 'pointerenter')
    vi.advanceTimersByTime(1000)
    expect(hide).not.toHaveBeenCalled()
    pointer(tip.element, 'pointerleave')
    vi.advanceTimersByTime(100)
    expect(hide).toHaveBeenCalledTimes(1)
  })

  it('stays open when the pointer returns to the trigger within the grace', () => {
    const { trigger } = setup()
    pointer(trigger, 'pointerenter')
    vi.advanceTimersByTime(400)
    pointer(trigger, 'pointerleave')
    vi.advanceTimersByTime(50)
    pointer(trigger, 'pointerenter')
    vi.advanceTimersByTime(1000)
    expect(hide).not.toHaveBeenCalled()
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('never shows for a touch pointer', () => {
    const { trigger } = setup()
    pointer(trigger, 'pointerenter', 'touch')
    vi.advanceTimersByTime(1000)
    expect(show).not.toHaveBeenCalled()
  })

  it('shows at once on a focus that matches :focus-visible, and hides on blur', () => {
    const { trigger } = setup()
    trigger.focus()
    expect(show).toHaveBeenCalledTimes(1)
    trigger.blur()
    expect(hide).toHaveBeenCalledTimes(1)
  })

  it('does not show on a focus that is not :focus-visible', () => {
    const { trigger } = setup()
    const matches = trigger.matches.bind(trigger)
    vi.spyOn(trigger, 'matches').mockImplementation((s: string) =>
      s === ':focus-visible' ? false : matches(s)
    )
    trigger.focus()
    vi.advanceTimersByTime(1000)
    expect(show).not.toHaveBeenCalled()
  })

  it('shows on focus where :focus-visible is not supported', () => {
    const { trigger } = setup()
    const matches = trigger.matches.bind(trigger)
    vi.spyOn(trigger, 'matches').mockImplementation((s: string) => {
      if (s === ':focus-visible') throw new SyntaxError('unsupported selector')
      return matches(s)
    })
    trigger.focus()
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('hides on Escape, and drops the document listener once hidden', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const { trigger } = setup()
    expect(add.mock.calls.filter(([t]) => t === 'keydown')).toHaveLength(0)
    trigger.focus()
    expect(add.mock.calls.filter(([t]) => t === 'keydown')).toHaveLength(1)
    esc()
    expect(hide).toHaveBeenCalledTimes(1)
    const handler = add.mock.calls.find(([t]) => t === 'keydown')![1]
    expect(remove).toHaveBeenCalledWith('keydown', handler)
    esc()
    expect(hide).toHaveBeenCalledTimes(1)
  })

  it('prevents the default of an Esc only while open, so an enclosing dialog stays open', () => {
    const { trigger } = setup()
    expect(esc().defaultPrevented).toBe(false)
    trigger.focus()
    expect(esc().defaultPrevented).toBe(true)
    expect(hide).toHaveBeenCalledTimes(1)
    // Hidden: the next Esc belongs to the dialog or popover around it.
    expect(esc().defaultPrevented).toBe(false)
  })

  it('ignores other keys', () => {
    const { trigger } = setup()
    trigger.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(hide).not.toHaveBeenCalled()
  })

  it('removes the document listener and pending timers on unmount', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const { w, trigger } = setup()
    trigger.focus()
    const handler = add.mock.calls.find(([t]) => t === 'keydown')![1]
    pointer(trigger, 'pointerleave')
    w.unmount()
    mounted.splice(mounted.indexOf(w), 1)
    expect(remove).toHaveBeenCalledWith('keydown', handler)
    show.mockClear()
    hide.mockClear()
    vi.advanceTimersByTime(1000)
    expect(show).not.toHaveBeenCalled()
    expect(hide).not.toHaveBeenCalled()
  })

  it('hides and drops the document listener when a KeepAlive deactivates it', async () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const Tip = defineComponent(() => () => h(BlTooltip, { text: 'Save the draft' }, button()))
    const Other = defineComponent(() => () => h('p', 'other'))
    const active = ref<'tip' | 'other'>('tip')
    const w = mount(
      defineComponent(() => () => h(KeepAlive, null, [h(active.value === 'tip' ? Tip : Other)])),
      { attachTo: document.body }
    )
    mounted.push(w)
    const trigger = w.get('button').element as HTMLButtonElement
    trigger.focus()
    expect(show).toHaveBeenCalledTimes(1)
    const handler = add.mock.calls.find(([t]) => t === 'keydown')![1]
    active.value = 'other'
    await nextTick()
    expect(hide).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith('keydown', handler)
    // Reactivated: closed state was reset, so the next hover shows it again.
    active.value = 'tip'
    await nextTick()
    pointer(w.get('button').element, 'pointerenter')
    vi.advanceTimersByTime(400)
    expect(show).toHaveBeenCalledTimes(2)
  })

  it('stays open on pointer leave while the trigger keeps keyboard focus', () => {
    const { trigger } = setup()
    trigger.focus()
    pointer(trigger, 'pointerenter')
    pointer(trigger, 'pointerleave')
    vi.advanceTimersByTime(1000)
    expect(hide).not.toHaveBeenCalled()
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('warns when text is empty', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setup({ text: '  ' })
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('BlTooltip'))
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('text'))
  })

  it('warns when the trigger is disabled', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setup({}, { disabled: true })
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('disabled'))
  })

  it('does not warn for an enabled trigger with text', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setup()
    expect(spy).not.toHaveBeenCalled()
  })

  it('renders the anchor wiring on the server', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(BlTooltip, { text: 'Save the draft' }, button()) })
    )
    expect(html).toMatch(/anchor-name:\s*--bl-/)
    expect(html).toMatch(/position-anchor:\s*--bl-/)
    expect(html).toContain('popover="manual"')
    expect(html).toContain('role="tooltip"')
  })
})
