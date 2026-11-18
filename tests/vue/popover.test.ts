import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import BlButton from '../../vue/components/BlButton.vue'
import BlPopover from '../../vue/components/BlPopover.vue'
import type { PopoverTriggerBind } from '../../vue/types'
import { mockTransition, transitionEnd } from './transitions'

// happy-dom has no popover API and ignores popovertarget: stub the methods, fire the events by hand.
const proto = HTMLElement.prototype as unknown as Record<string, unknown>
let show: ReturnType<typeof vi.fn>
let hide: ReturnType<typeof vi.fn>
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development')
  show = vi.fn()
  hide = vi.fn()
  proto['showPopover'] = show
  proto['hidePopover'] = hide
  proto['togglePopover'] = vi.fn()
})
afterEach(() => {
  delete proto['showPopover']
  delete proto['hidePopover']
  delete proto['togglePopover']
  document.body.innerHTML = ''
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function beforeToggle(el: Element, newState: 'open' | 'closed'): void {
  const e = new Event('beforetoggle')
  Object.assign(e, { newState, oldState: newState === 'open' ? 'closed' : 'open' })
  el.dispatchEvent(e)
}

const button = { trigger: ({ bind }: { bind: PopoverTriggerBind }) => h('button', bind, 'More') }

describe('BlPopover', () => {
  it('renders an auto popover panel placed bottom/center by default', () => {
    const w = mount(BlPopover, { slots: { ...button, default: 'Body' } })
    const panel = w.get('div.bl-popover')
    expect(panel.attributes('popover')).toBe('auto')
    expect(panel.attributes('data-side')).toBe('bottom')
    expect(panel.attributes('data-align')).toBe('center')
    expect(panel.text()).toBe('Body')
  })

  it('passes side and align through', () => {
    const w = mount(BlPopover, { props: { side: 'end', align: 'start' }, slots: button })
    expect(w.get('.bl-popover').attributes('data-side')).toBe('end')
    expect(w.get('.bl-popover').attributes('data-align')).toBe('start')
  })

  it('wires the trigger to the panel', () => {
    const w = mount(BlPopover, { slots: button })
    const trigger = w.get('button')
    const panel = w.get('.bl-popover')
    expect(trigger.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(trigger.attributes('popovertarget')).toBe(panel.attributes('id'))
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('hands the trigger id, type=button, the aria wiring, popovertarget and the anchor', () => {
    let got: PopoverTriggerBind | undefined
    const w = mount(BlPopover, {
      slots: {
        trigger: ({ bind }: { bind: PopoverTriggerBind }) => {
          got = bind
          return h('button', bind, 'More')
        }
      }
    })
    const panelId = w.get('.bl-popover').attributes('id')
    expect(got).toEqual({
      id: expect.stringMatching(/-trigger$/),
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': panelId,
      popovertarget: panelId,
      style: { anchorName: expect.stringMatching(/^--bl-/) }
    })
  })

  it('does not submit an enclosing form from a plain <button> trigger', () => {
    const w = mount(
      defineComponent(() => () => h('form', [h(BlPopover, null, button)])),
      { attachTo: document.body }
    )
    const el = w.get('button').element as HTMLButtonElement
    expect(el.type).toBe('button')
    const submit = vi.fn((e: Event) => e.preventDefault())
    w.get('form').element.addEventListener('submit', submit)
    el.click()
    expect(submit).not.toHaveBeenCalled()
    w.unmount()
  })

  it('spreads onto BlButton as a non-submitting button', () => {
    const w = mount(BlPopover, {
      slots: {
        trigger: ({ bind }: { bind: PopoverTriggerBind }) => h(BlButton, bind, () => 'More')
      }
    })
    const el = w.get('button')
    expect(el.attributes('type')).toBe('button')
    expect(el.attributes('aria-controls')).toBe(w.get('.bl-popover').attributes('id'))
  })

  it('shows the panel once when open is set, and reflects it on the trigger', async () => {
    const w = mount(BlPopover, { props: { open: false }, slots: button, attachTo: document.body })
    await w.setProps({ open: true })
    await nextTick()
    expect(show).toHaveBeenCalledTimes(1)
    expect(w.get('button').attributes('aria-expanded')).toBe('true')
    await w.setProps({ open: false })
    await nextTick()
    expect(hide).toHaveBeenCalledTimes(1)
    expect(w.get('button').attributes('aria-expanded')).toBe('false')
  })

  it('shows the panel on mount when open starts true', async () => {
    mount(BlPopover, { props: { open: true }, slots: button, attachTo: document.body })
    await nextTick()
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('follows beforetoggle and emits update:open', async () => {
    const w = mount(BlPopover, { slots: button, attachTo: document.body })
    beforeToggle(w.get('.bl-popover').element, 'open')
    expect(w.emitted('update:open')?.at(-1)).toEqual([true])
    await nextTick()
    expect(w.get('button').attributes('aria-expanded')).toBe('true')
    expect(show).not.toHaveBeenCalled()
    beforeToggle(w.get('.bl-popover').element, 'closed')
    expect(w.emitted('update:open')?.at(-1)).toEqual([false])
    await nextTick()
    expect(hide).not.toHaveBeenCalled()
  })

  it('toggles once when a trigger click also sets the model', async () => {
    vi.useFakeTimers()
    const Host = defineComponent({
      setup() {
        const open = ref(false)
        return () =>
          h(
            BlPopover,
            { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) },
            {
              trigger: ({ bind }: { bind: PopoverTriggerBind }) =>
                h('button', { ...bind, onClick: () => (open.value = true) }, 'More')
            }
          )
      }
    })
    const w = mount(Host, { attachTo: document.body })
    const trigger = w.get('button').element as HTMLButtonElement
    trigger.click() // the consumer handler sets the model during the click...
    await nextTick()
    beforeToggle(w.get('.bl-popover').element, 'open') // ...and the browser toggles natively
    await nextTick()
    vi.runAllTimers()
    await nextTick()
    expect(show).not.toHaveBeenCalled()
    expect(hide).not.toHaveBeenCalled()
    expect(w.get('button').attributes('aria-expanded')).toBe('true')
    vi.useRealTimers()
  })

  it('shows from the model after a trigger click the browser did not act on', async () => {
    vi.useFakeTimers()
    const Host = defineComponent({
      setup() {
        const open = ref(false)
        return () =>
          h(
            BlPopover,
            { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) },
            {
              trigger: ({ bind }: { bind: PopoverTriggerBind }) =>
                h('button', { ...bind, onClick: () => (open.value = true) }, 'More')
            }
          )
      }
    })
    const w = mount(Host, { attachTo: document.body })
    ;(w.get('button').element as HTMLButtonElement).click()
    await nextTick()
    vi.runAllTimers()
    await nextTick()
    expect(show).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('has no role by default, and is a labelled group with ariaLabel', () => {
    const plain = mount(BlPopover, { slots: button })
    expect(plain.get('.bl-popover').attributes('role')).toBeUndefined()
    expect(plain.get('.bl-popover').attributes('aria-label')).toBeUndefined()
    const named = mount(BlPopover, { props: { ariaLabel: 'Filters' }, slots: button })
    expect(named.get('.bl-popover').attributes('role')).toBe('group')
    expect(named.get('.bl-popover').attributes('aria-label')).toBe('Filters')
  })

  it('never marks the panel modal', () => {
    const w = mount(BlPopover, { props: { ariaLabel: 'Filters' }, slots: button })
    expect(w.get('.bl-popover').attributes('aria-modal')).toBeUndefined()
  })

  it('never labels the panel by the trigger, with or without ariaLabel', async () => {
    // A role-less div may not carry aria-labelledby (ARIA 1.2); aria-expanded/aria-controls on the
    // trigger already relate the two.
    const plain = mount(BlPopover, { slots: button, attachTo: document.body })
    const named = mount(BlPopover, {
      props: { ariaLabel: 'Filters' },
      slots: button,
      attachTo: document.body
    })
    await nextTick()
    for (const w of [plain, named])
      expect(w.get('.bl-popover').attributes('aria-labelledby')).toBeUndefined()
  })

  it('keeps aria-controls and popovertarget when a consumer id on the trigger wins', async () => {
    const w = mount(BlPopover, {
      slots: {
        trigger: ({ bind }: { bind: PopoverTriggerBind }) =>
          h('button', { ...bind, id: 'mine' }, 'More')
      },
      attachTo: document.body
    })
    await nextTick()
    const trigger = w.get('button')
    const panelId = w.get('.bl-popover').attributes('id')
    expect(trigger.attributes('id')).toBe('mine')
    expect(trigger.attributes('aria-controls')).toBe(panelId)
    expect(trigger.attributes('popovertarget')).toBe(panelId)
  })

  it('warns when the trigger slot renders no element', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BlPopover, { slots: { default: 'Body' } })
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('BlPopover'))
  })

  it('warns when the trigger is not a button', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BlPopover, {
      slots: {
        trigger: ({ bind }: { bind: PopoverTriggerBind }) => h('a', { ...bind, href: '#x' }, 'More')
      }
    })
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('<button>'))
  })

  it('does not warn for a button trigger', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BlPopover, { slots: button })
    expect(spy).not.toHaveBeenCalled()
  })

  it('gives two instances different anchor names', () => {
    const binds: PopoverTriggerBind[] = []
    const trigger = ({ bind }: { bind: PopoverTriggerBind }) => {
      binds.push(bind)
      return h('button', bind, 'More')
    }
    const Host = defineComponent({
      setup: () => () => [h(BlPopover, null, { trigger }), h(BlPopover, null, { trigger })]
    })
    const w = mount(Host)
    const panels = w.findAll('.bl-popover')
    expect(binds[0]!.style.anchorName).toMatch(/^--bl-/)
    expect(binds[0]!.style.anchorName).not.toBe(binds[1]!.style.anchorName)
    expect(panels[0]!.attributes('id')).not.toBe(panels[1]!.attributes('id'))
  })

  it('renders anchor-name and position-anchor on the server', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(BlPopover, null, { ...button, default: () => 'Body' }) })
    )
    expect(html).toMatch(/anchor-name:\s*--bl-/)
    expect(html).toMatch(/position-anchor:\s*--bl-/)
    expect(html).toContain('popover="auto"')
  })

  describe('exit', () => {
    // The panel fades out over 200ms before hidePopover() runs.
    async function fading(props: Record<string, unknown> = { open: true }) {
      const w = mount(BlPopover, { props, slots: button, attachTo: document.body })
      const panel = w.get('.bl-popover').element
      mockTransition([panel, { property: 'opacity, scale', duration: '0.2s, 0.2s' }])
      await nextTick()
      return { w, panel, trigger: w.get('button').element as HTMLButtonElement }
    }

    it('v-model false fades the panel out before hiding it', async () => {
      const { w, panel } = await fading()
      await w.setProps({ open: false })
      await nextTick()
      expect(panel.hasAttribute('data-closing')).toBe(true)
      expect(hide).not.toHaveBeenCalled()
      expect(w.get('button').attributes('aria-expanded')).toBe('false')
      transitionEnd(panel, 'opacity')
      expect(hide).toHaveBeenCalledTimes(1)
      expect(panel.hasAttribute('data-closing')).toBe(false)
    })

    it('makes the panel inert during the exit and hands focus inside it to the trigger', async () => {
      const w = mount(BlPopover, {
        props: { open: true },
        slots: { ...button, default: '<button class="apply">Apply</button>' },
        attachTo: document.body
      })
      const panel = w.get<HTMLElement>('.bl-popover').element
      mockTransition([panel, { property: 'opacity', duration: '0.2s' }])
      await nextTick()
      w.get<HTMLElement>('.apply').element.focus()
      await w.setProps({ open: false })
      await nextTick()
      expect(panel.inert).toBe(true)
      expect(document.activeElement).toBe(w.get('button').element) // where hidePopover puts it
      transitionEnd(panel, 'opacity')
      expect(hide).toHaveBeenCalledTimes(1)
      expect(panel.inert).toBe(false)
    })

    it('without a wired trigger, leaves focus where it is for hidePopover() to restore', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const w = mount(BlPopover, {
        props: { open: true },
        slots: {
          trigger: () => h('button', 'Loose'),
          default: '<button class="apply">Apply</button>'
        },
        attachTo: document.body
      })
      const panel = w.get('.bl-popover').element as HTMLElement
      mockTransition([panel, { property: 'opacity', duration: '0.2s' }])
      await nextTick()
      const apply = w.get<HTMLElement>('.apply').element
      apply.focus()
      await w.setProps({ open: false })
      await nextTick()
      expect(panel.inert).toBe(true)
      expect(document.activeElement).toBe(apply) // not the panel, about to be inert
    })

    it("a consumer's preventDefault on the trigger click keeps a showing panel open", async () => {
      vi.useFakeTimers()
      try {
        const w = mount(BlPopover, {
          props: { open: true },
          slots: {
            trigger: ({ bind }: { bind: PopoverTriggerBind }) =>
              h('button', { ...bind, onClick: (e: Event) => e.preventDefault() }, 'More')
          },
          attachTo: document.body
        })
        const panel = w.get('.bl-popover').element
        mockTransition([panel, { property: 'opacity', duration: '0.2s' }])
        await nextTick()
        ;(w.get('button').element as HTMLButtonElement).click()
        vi.runOnlyPendingTimers()
        await nextTick()
        expect(w.emitted('update:open')).toBeUndefined()
        expect(panel.hasAttribute('data-closing')).toBe(false)
        vi.advanceTimersByTime(1000)
        expect(hide).not.toHaveBeenCalled()
      } finally {
        vi.useRealTimers()
      }
    })

    it('v-model true during the exit keeps it open', async () => {
      vi.useFakeTimers()
      try {
        const { w, panel } = await fading()
        await w.setProps({ open: false })
        await nextTick()
        await w.setProps({ open: true })
        await nextTick()
        expect(panel.hasAttribute('data-closing')).toBe(false)
        expect((panel as HTMLElement).inert).toBe(false)
        vi.advanceTimersByTime(1000)
        expect(hide).not.toHaveBeenCalled()
        expect(show).toHaveBeenCalledTimes(1) // the first open only
      } finally {
        vi.useRealTimers()
      }
    })

    it('a trigger click on the open panel closes it with the exit, not by the native toggle', async () => {
      vi.useFakeTimers()
      try {
        const { w, panel, trigger } = await fading()
        const click = new MouseEvent('click', { bubbles: true, cancelable: true })
        trigger.dispatchEvent(click)
        expect(click.defaultPrevented).toBe(true) // the browser does not toggle it
        vi.runOnlyPendingTimers()
        await nextTick()
        expect(w.emitted('update:open')?.at(-1)).toEqual([false])
        expect(panel.hasAttribute('data-closing')).toBe(true)
        expect(hide).not.toHaveBeenCalled()
        vi.advanceTimersByTime(250)
        expect(hide).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })

    it('a trigger click during the exit keeps it open', async () => {
      vi.useFakeTimers()
      try {
        const { w, panel, trigger } = await fading()
        await w.setProps({ open: false })
        await nextTick()
        expect(panel.hasAttribute('data-closing')).toBe(true)
        const click = new MouseEvent('click', { bubbles: true, cancelable: true })
        trigger.dispatchEvent(click)
        expect(click.defaultPrevented).toBe(true)
        vi.runOnlyPendingTimers()
        await nextTick()
        expect(w.emitted('update:open')?.at(-1)).toEqual([true])
        expect(panel.hasAttribute('data-closing')).toBe(false)
        vi.advanceTimersByTime(1000)
        expect(hide).not.toHaveBeenCalled()
      } finally {
        vi.useRealTimers()
      }
    })

    it('a light dismiss during the exit ends it', async () => {
      vi.useFakeTimers()
      try {
        const { w, panel } = await fading()
        await w.setProps({ open: false })
        await nextTick()
        beforeToggle(panel, 'closed') // the browser hides it (outside click, Esc)
        expect(panel.hasAttribute('data-closing')).toBe(false)
        vi.advanceTimersByTime(1000)
        expect(hide).not.toHaveBeenCalled()
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
