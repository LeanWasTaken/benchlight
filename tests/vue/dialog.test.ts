import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import BlDialog from '../../vue/components/BlDialog.vue'
import { toastFocus, toastHosts } from '../../vue/internal/toastHosts'
import { mockTransition, transitionEnd } from './transitions'

let wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  vi.restoreAllMocks()
  toastHosts.value = []
  toastFocus.returnTarget = null
})

function open(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const w = mount(BlDialog, {
    props: { open: false, title: 'Rename', ...props },
    slots: { default: 'Body', ...slots },
    attachTo: document.body
  })
  wrappers.push(w)
  return w
}
const dialogEl = (w: VueWrapper) => w.element as HTMLDialogElement
function esc(w: VueWrapper) {
  const ev = new Event('cancel', { cancelable: true })
  dialogEl(w).dispatchEvent(ev)
  if (!ev.defaultPrevented) dialogEl(w).close()
}

describe('BlDialog', () => {
  it('names itself by the title and describes itself by the description', () => {
    const w = open({ description: 'Pick a new name' })
    const d = dialogEl(w)
    expect(d.getAttribute('aria-labelledby')).toBe(w.get('.bl-dialog__title').attributes('id'))
    expect(d.getAttribute('aria-describedby')).toBe(
      w.get('.bl-dialog__description').attributes('id')
    )
    expect(d.hasAttribute('open')).toBe(false) // never rendered open
  })

  it('omits aria-describedby without a description', () => {
    expect(dialogEl(open()).hasAttribute('aria-describedby')).toBe(false)
  })

  it('opens with showModal when open turns true, and when mounted open', async () => {
    const w = open()
    const spy = vi.spyOn(dialogEl(w), 'showModal')
    await w.setProps({ open: true })
    expect(spy).toHaveBeenCalledOnce()
    expect(dialogEl(w).open).toBe(true)
    const m = open({ open: true })
    await nextTick()
    expect(dialogEl(m).open).toBe(true)
  })

  it.each([
    ['button', (w: VueWrapper) => w.get('.bl-dialog__close').trigger('click')],
    ['escape', (w: VueWrapper) => esc(w)],
    ['native', (w: VueWrapper) => dialogEl(w).close('done')]
  ] as const)('closes with reason %s and emits update:open once', async (reason, act) => {
    const w = open({ open: true })
    await nextTick()
    await act(w)
    expect(w.emitted('update:open')).toEqual([[false]])
    const close = w.emitted('close')!
    expect(close).toHaveLength(1)
    expect((close[0]![0] as { reason: string }).reason).toBe(reason)
  })

  it('passes the returnValue given to close()', async () => {
    const w = open({ open: true })
    await nextTick()
    dialogEl(w).close('confirm')
    expect((w.emitted('close')![0]![0] as { returnValue: string }).returnValue).toBe('confirm')
  })

  it('reports program when the parent closes it, without echoing update:open', async () => {
    const w = open({ open: true })
    await nextTick()
    await w.setProps({ open: false })
    expect(dialogEl(w).open).toBe(false)
    expect(w.emitted('update:open')).toBeUndefined()
    expect((w.emitted('close')![0]![0] as { reason: string }).reason).toBe('program')
  })

  it('closes on a backdrop click only when the press also started on the backdrop', async () => {
    const w = open({ open: true })
    await nextTick()
    const d = dialogEl(w)
    // press in the panel, release on the backdrop: not a backdrop click
    w.get('.bl-dialog__panel').trigger('pointerdown')
    d.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(d.open).toBe(true)
    d.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    d.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(d.open).toBe(false)
    expect((w.emitted('close')![0]![0] as { reason: string }).reason).toBe('backdrop')
  })

  it('dismissible=false: no close button, closedby=none, Esc and backdrop ignored', async () => {
    const w = open({ open: true, dismissible: false }, { footer: '<button>OK</button>' })
    await nextTick()
    expect(w.find('.bl-dialog__close').exists()).toBe(false)
    expect(dialogEl(w).getAttribute('closedby')).toBe('none')
    esc(w)
    dialogEl(w).dispatchEvent(new Event('pointerdown', { bubbles: true }))
    dialogEl(w).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(dialogEl(w).open).toBe(true)
    expect(w.emitted('close')).toBeUndefined()
  })

  it('warns when dismissible=false leaves no way out', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    open({ open: true, dismissible: false })
    await nextTick()
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('BlDialog'))
  })

  it('restores focus to the opener only when focus was lost', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const w = open()
    await w.setProps({ open: true })
    w.get<HTMLElement>('.bl-dialog__close').element.focus()
    await w.get('.bl-dialog__close').trigger('click')
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })

  it('focuses the dialog itself on open when nothing inside asks for focus', async () => {
    const w = open()
    await w.setProps({ open: true })
    const d = dialogEl(w)
    expect(d.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(d)
  })

  // happy-dom has no dialog focusing steps: run them as the HTML spec does on showModal() (the
  // dialog itself if it has autofocus, else its focus delegate: an autofocus descendant, else
  // the first focusable one).
  function focusingSteps(d: HTMLDialogElement) {
    const real = d.showModal.bind(d)
    vi.spyOn(d, 'showModal').mockImplementation(() => {
      real()
      const target = d.hasAttribute('autofocus')
        ? d
        : (d.querySelector<HTMLElement>('[autofocus]') ??
          d.querySelector<HTMLElement>('button, input, select, textarea, [tabindex]'))
      target?.focus()
    })
  }

  it('lets showModal() focus the dialog directly, never the × first', async () => {
    const w = open()
    const d = dialogEl(w)
    focusingSteps(d)
    const close = w.get<HTMLElement>('.bl-dialog__close').element
    const touched: string[] = []
    close.addEventListener('focus', () => touched.push('focus'))
    close.addEventListener('blur', () => touched.push('blur'))
    await w.setProps({ open: true })
    expect(document.activeElement).toBe(d)
    expect(touched).toEqual([])
    expect(d.hasAttribute('autofocus')).toBe(false) // only for the showModal() call
  })

  it('leaves focus to an autofocus element inside', async () => {
    const w = open({}, { default: '<input class="name" autofocus />' })
    const d = dialogEl(w)
    focusingSteps(d)
    await w.setProps({ open: true })
    expect(document.activeElement).toBe(w.get('.name').element)
  })

  it('keeps an autofocus attribute the consumer put on the dialog', async () => {
    const w = open({ autofocus: '' })
    const d = dialogEl(w)
    focusingSteps(d)
    await w.setProps({ open: true })
    expect(document.activeElement).toBe(d)
    expect(d.hasAttribute('autofocus')).toBe(true)
  })

  it('sets and removes the scrollbar gutter property and the toast host', async () => {
    const w = open()
    await w.setProps({ open: true })
    expect(document.documentElement.style.getPropertyValue('--bl-dialog-gutter')).toMatch(/px$/)
    expect(toastHosts.value).toEqual([w.get('.bl-dialog__toasts').element])
    await w.setProps({ open: false })
    expect(document.documentElement.style.getPropertyValue('--bl-dialog-gutter')).toBe('')
    expect(toastHosts.value).toEqual([])
  })

  it('hosts toasts beside the panel, outside its entry transform', () => {
    const w = open()
    const host = w.get('.bl-dialog__toasts').element
    expect(host.parentElement).toBe(dialogEl(w))
    expect(w.get('.bl-dialog__panel').element.contains(host)).toBe(false)
  })

  it('releases the toast host when it starts closing, not in the async close event', async () => {
    const w = open()
    await w.setProps({ open: true })
    // A real browser fires close a task later; hold it back to see what happens first.
    const close = vi.spyOn(dialogEl(w), 'close').mockImplementation(() => {})
    await w.setProps({ open: false })
    expect(toastHosts.value).toEqual([])
    close.mockRestore()
    dialogEl(w).close()
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('reopens when open turns false and back to true before the async close event', async () => {
    const w = open()
    await w.setProps({ open: true })
    const d = dialogEl(w)
    const host = w.get('.bl-dialog__toasts').element
    // A real browser fires close a task after close(); hold the event back like one.
    const held: Event[] = []
    const hold = (e: Event) => {
      if (e.target !== d || held.includes(e)) return
      e.stopImmediatePropagation()
      held.push(e)
    }
    window.addEventListener('close', hold, true)
    await w.setProps({ open: false })
    expect(d.open).toBe(false)
    expect(w.emitted('close')).toBeUndefined() // the event is still queued
    await w.setProps({ open: true })
    expect(d.open).toBe(true)
    // the previous session is settled exactly once, without echoing update:open
    expect(w.emitted('close')).toEqual([[{ reason: 'program', returnValue: '' }]])
    expect(w.emitted('update:open')).toBeUndefined()
    expect(toastHosts.value).toEqual([host])
    // the late close event belongs to the settled session and changes nothing
    window.removeEventListener('close', hold, true)
    for (const e of held) d.dispatchEvent(new Event(e.type))
    expect(d.open).toBe(true)
    expect(w.emitted('close')).toHaveLength(1)
    expect(toastHosts.value).toEqual([host])
    // the new session closes and emits once; the page lock was taken once per session
    await w.get('.bl-dialog__close').trigger('click')
    expect(w.emitted('close')).toHaveLength(2)
    expect((w.emitted('close')![1]![0] as { reason: string }).reason).toBe('button')
    expect(w.emitted('update:open')).toEqual([[false]])
    expect(document.documentElement.style.getPropertyValue('--bl-dialog-gutter')).toBe('')
    expect(toastHosts.value).toEqual([])
  })

  it('returns focus to where it was before the toast when opened from a toast action', async () => {
    const before = document.createElement('button')
    const toaster = document.createElement('section')
    toaster.className = 'bl-toaster'
    const action = document.createElement('button')
    toaster.append(action)
    document.body.append(before, toaster)
    toastFocus.returnTarget = before
    action.focus()
    const w = open()
    await w.setProps({ open: true })
    action.remove() // the action's toast is dismissed right after it runs
    w.get<HTMLElement>('.bl-dialog__close').element.focus()
    await w.get('.bl-dialog__close').trigger('click')
    expect(document.activeElement).toBe(before)
    before.remove()
    toaster.remove()
  })

  it('treats an opener inside a leaving toast as gone', async () => {
    const before = document.createElement('button')
    const toast = document.createElement('li')
    toast.className = 'bl-toaster'
    const action = document.createElement('button')
    toast.append(action)
    document.body.append(before, toast)
    toastFocus.returnTarget = before
    action.focus()
    const w = open()
    await w.setProps({ open: true })
    toast.classList.add('bl-toast-leave-active') // still connected while it animates out
    action.focus() // where the browser's own restore would put it
    await w.setProps({ open: false })
    expect(document.activeElement).toBe(before)
    before.remove()
    toast.remove()
  })

  it('keeps focus that a close handler moved', async () => {
    const opener = document.createElement('button')
    const other = document.createElement('button')
    document.body.append(opener, other)
    opener.focus()
    const w = open({ onClose: () => other.focus() })
    await w.setProps({ open: true })
    w.get<HTMLElement>('.bl-dialog__close').element.focus()
    await w.get('.bl-dialog__close').trigger('click')
    expect(document.activeElement).toBe(other)
    opener.remove()
    other.remove()
  })

  it('keeps one gutter measurement across nested dialogs', async () => {
    const root = document.documentElement.style
    const a = open()
    const b = open({ title: 'Inner' })
    await a.setProps({ open: true })
    const first = root.getPropertyValue('--bl-dialog-gutter')
    await b.setProps({ open: true })
    await b.setProps({ open: false })
    expect(root.getPropertyValue('--bl-dialog-gutter')).toBe(first)
    await a.setProps({ open: false })
    expect(root.getPropertyValue('--bl-dialog-gutter')).toBe('')
  })

  it('closes quietly and restores focus when unmounted while open', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const w = open()
    await w.setProps({ open: true })
    w.get<HTMLElement>('.bl-dialog__close').element.focus()
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(w.emitted('close')).toBeUndefined()
    expect(document.activeElement).toBe(opener)
    expect(toastHosts.value).toEqual([])
    opener.remove()
  })

  it('uses labels.close for the close button name', async () => {
    const w = open({ open: true, labels: { close: 'Sulgeda' } })
    expect(w.get('.bl-dialog__close').attributes('aria-label')).toBe('Sulgeda')
  })

  it('round-trips v-model', async () => {
    const Host = defineComponent({
      setup() {
        const isOpen = ref(true)
        return () =>
          h(BlDialog, {
            open: isOpen.value,
            'onUpdate:open': (v: boolean) => (isOpen.value = v),
            title: 'T'
          })
      }
    })
    const w = mount(Host, { attachTo: document.body })
    wrappers.push(w)
    await nextTick()
    const d = w.get('dialog').element as HTMLDialogElement
    expect(d.open).toBe(true)
    d.close()
    await nextTick()
    expect(d.open).toBe(false)
  })
})

describe('BlDialog exit animation', () => {
  // The panel fades out over 200ms before close() runs.
  async function animated(props: Record<string, unknown> = {}) {
    const w = open(props)
    mockTransition([
      w.get('.bl-dialog__panel').element,
      { property: 'opacity, scale, translate', duration: '0.2s, 0.2s, 0.2s' }
    ])
    await w.setProps({ open: true })
    return w
  }
  const panel = (w: VueWrapper) => w.get('.bl-dialog__panel').element
  const reasons = (w: VueWrapper) =>
    (w.emitted('close') ?? []).map((e) => (e[0] as { reason: string }).reason)

  it('stays open with data-closing until the panel transition ends, then emits', async () => {
    const w = await animated()
    const d = dialogEl(w)
    await w.get('.bl-dialog__close').trigger('click')
    expect(d.open).toBe(true)
    expect(d.hasAttribute('data-closing')).toBe(true)
    // still modal, so the page is inert: its toasts stay inside until close()
    expect(toastHosts.value).toEqual([w.get('.bl-dialog__toasts').element])
    expect(w.emitted('close')).toBeUndefined()
    expect(w.emitted('update:open')).toBeUndefined()
    transitionEnd(panel(w), 'translate') // not the property waited on
    expect(d.open).toBe(true)
    transitionEnd(panel(w), 'opacity')
    expect(d.open).toBe(false)
    expect(d.hasAttribute('data-closing')).toBe(false)
    expect(toastHosts.value).toEqual([])
    expect(reasons(w)).toEqual(['button'])
    expect(w.emitted('update:open')).toEqual([[false]])
  })

  it('closes on a timer when no transitionend arrives', async () => {
    vi.useFakeTimers()
    try {
      const w = await animated()
      await w.setProps({ open: false })
      vi.advanceTimersByTime(249)
      expect(dialogEl(w).open).toBe(true)
      vi.advanceTimersByTime(1)
      expect(dialogEl(w).open).toBe(false)
      expect(reasons(w)).toEqual(['program'])
      expect(w.emitted('update:open')).toBeUndefined() // program: no echo
    } finally {
      vi.useRealTimers()
    }
  })

  it('ignores further closes while closing', async () => {
    const w = await animated()
    const d = dialogEl(w)
    await w.get('.bl-dialog__close').trigger('click')
    d.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    d.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    esc(w)
    await w.setProps({ open: false })
    expect(d.open).toBe(true)
    transitionEnd(panel(w), 'opacity')
    expect(reasons(w)).toEqual(['button'])
  })

  it('animates Esc when cancel is cancelable', async () => {
    const w = await animated()
    const d = dialogEl(w)
    const ev = new Event('cancel', { cancelable: true })
    d.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    expect(d.open).toBe(true)
    expect(d.hasAttribute('data-closing')).toBe(true)
    transitionEnd(panel(w), 'opacity')
    expect(d.open).toBe(false)
    expect(reasons(w)).toEqual(['escape'])
  })

  it('keeps the old Esc path when cancel is not cancelable', async () => {
    const w = await animated()
    const d = dialogEl(w)
    d.dispatchEvent(new Event('cancel'))
    d.close() // the browser closes it
    expect(reasons(w)).toEqual(['escape'])
  })

  it('reopened while closing: settles the first session once and opens again', async () => {
    vi.useFakeTimers()
    try {
      const w = await animated()
      const d = dialogEl(w)
      await w.setProps({ open: false })
      await w.setProps({ open: true })
      expect(d.open).toBe(true)
      expect(d.hasAttribute('data-closing')).toBe(false)
      expect(reasons(w)).toEqual(['program'])
      expect(w.emitted('update:open')).toBeUndefined()
      expect(toastHosts.value).toEqual([w.get('.bl-dialog__toasts').element])
      // the cancelled exit never fires
      transitionEnd(panel(w), 'opacity')
      vi.advanceTimersByTime(1000)
      expect(d.open).toBe(true)
      expect(reasons(w)).toEqual(['program'])
    } finally {
      vi.useRealTimers()
    }
  })

  it('unmounted while closing: closes at once, emits nothing, restores focus, unlocks', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const w = await animated()
    const d = dialogEl(w)
    w.get<HTMLElement>('.bl-dialog__close').element.focus()
    await w.get('.bl-dialog__close').trigger('click')
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(d.open).toBe(false)
    expect(d.hasAttribute('data-closing')).toBe(false)
    expect(w.emitted('close')).toBeUndefined()
    expect(w.emitted('update:open')).toBeUndefined()
    expect(document.activeElement).toBe(opener)
    expect(document.documentElement.style.getPropertyValue('--bl-dialog-gutter')).toBe('')
    expect(toastHosts.value).toEqual([])
    opener.remove()
  })

  it('a native close during the exit settles at once', async () => {
    const w = await animated()
    const d = dialogEl(w)
    await w.get('.bl-dialog__close').trigger('click')
    d.close('done')
    expect(d.hasAttribute('data-closing')).toBe(false)
    expect(reasons(w)).toEqual(['button'])
    transitionEnd(panel(w), 'opacity')
    expect(w.emitted('close')).toHaveLength(1)
  })

  // pointer-events: none stops only the mouse: a focused control would still take Enter.
  it('makes the panel inert during the exit, not the toast host', async () => {
    const w = await animated()
    const d = dialogEl(w)
    w.get<HTMLElement>('.bl-dialog__close').element.focus()
    await w.get('.bl-dialog__close').trigger('click')
    expect((panel(w) as HTMLElement).inert).toBe(true)
    expect(w.get<HTMLElement>('.bl-dialog__toasts').element.inert).toBe(false)
    // Chromium moves focus off an inert element only at the next frame: move it at once
    expect(document.activeElement).toBe(d)
    transitionEnd(panel(w), 'opacity')
    expect(d.open).toBe(false)
    expect((panel(w) as HTMLElement).inert).toBe(false)
  })

  it('clears inert when reopened during the exit', async () => {
    const w = await animated()
    await w.setProps({ open: false })
    expect((panel(w) as HTMLElement).inert).toBe(true)
    await w.setProps({ open: true })
    expect((panel(w) as HTMLElement).inert).toBe(false)
  })

  it('returns focus to the opener after the exit, also when it fell to <body>', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const w = await animated()
    w.get<HTMLElement>('.bl-dialog__close').element.focus()
    await w.get('.bl-dialog__close').trigger('click')
    transitionEnd(panel(w), 'opacity')
    expect(document.activeElement).toBe(opener) // from the dialog itself
    opener.remove()
  })

  it('returns focus to the opener when focus fell to <body> during the exit', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const w = await animated()
    w.get<HTMLElement>('.bl-dialog__close').element.focus()
    await w.get('.bl-dialog__close').trigger('click')
    ;(document.activeElement as HTMLElement).blur() // as if it fell to <body>
    transitionEnd(panel(w), 'opacity')
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })

  // A KeepAlive host swapped out mid-exit: a user close is settled, a program close dropped.
  function keptAlive() {
    const show = ref(true)
    const isOpen = ref(true)
    const events: string[] = []
    const Host = defineComponent({
      setup: () => () =>
        h(KeepAlive, null, [
          show.value
            ? h(BlDialog, {
                key: 'd',
                title: 'T',
                open: isOpen.value,
                'onUpdate:open': (v: boolean) => {
                  events.push(`update:open ${v}`)
                  isOpen.value = v
                },
                onClose: (e: { reason: string }) => events.push(`close ${e.reason}`)
              })
            : h('p', 'other')
        ])
    })
    const w = mount(Host, { attachTo: document.body })
    wrappers.push(w)
    return { w, show, isOpen, events }
  }

  it('deactivated during a user close: settles it, and does not reopen on activation', async () => {
    const { w, show, events } = keptAlive()
    await nextTick()
    const d = w.get('dialog').element as HTMLDialogElement
    mockTransition([
      d.querySelector('.bl-dialog__panel')!,
      { property: 'opacity', duration: '0.2s' }
    ])
    await w.get('.bl-dialog__close').trigger('click')
    expect(d.hasAttribute('data-closing')).toBe(true)
    show.value = false
    await nextTick()
    expect(d.open).toBe(false)
    expect(d.hasAttribute('data-closing')).toBe(false)
    expect(events).toEqual(['update:open false', 'close button'])
    show.value = true
    await nextTick()
    expect(d.open).toBe(false)
  })

  it('deactivated during a program close: drops it quietly, as before', async () => {
    const { w, show, isOpen, events } = keptAlive()
    await nextTick()
    const d = w.get('dialog').element as HTMLDialogElement
    mockTransition([
      d.querySelector('.bl-dialog__panel')!,
      { property: 'opacity', duration: '0.2s' }
    ])
    isOpen.value = false
    await nextTick()
    expect(d.hasAttribute('data-closing')).toBe(true)
    show.value = false
    await nextTick()
    expect(d.open).toBe(false)
    expect(events).toEqual([])
    show.value = true
    await nextTick()
    expect(d.open).toBe(false)
  })

  it('a cancelable Esc during a program exit keeps the reason (not dismissible)', async () => {
    const w = open({ dismissible: false }, { footer: '<button>OK</button>' })
    mockTransition([w.get('.bl-dialog__panel').element, { property: 'opacity', duration: '0.2s' }])
    await w.setProps({ open: true })
    await w.setProps({ open: false })
    const d = dialogEl(w)
    const ev = new Event('cancel', { cancelable: true })
    d.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    transitionEnd(panel(w), 'opacity')
    expect(reasons(w)).toEqual(['program'])
  })
})
