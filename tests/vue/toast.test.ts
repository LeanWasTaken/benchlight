import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import BlDialog from '../../vue/components/BlDialog.vue'
import BlToaster from '../../vue/components/BlToaster.vue'
import { useToast } from '../../vue/composables/useToast'
import { resetToastStore } from '../../vue/internal/toastStore'
import {
  pushToastHost,
  removeToastHost,
  toastFocus,
  toastHosts
} from '../../vue/internal/toastHosts'

let w: VueWrapper | undefined
const { toast, dismiss, clear } = useToast()
const items = () => w!.findAll('.bl-toast')
const spoken = (role: 'status' | 'alert') =>
  [...w!.get(`[role="${role}"]`).element.querySelectorAll('p')].map((p) => p.textContent)

beforeEach(() => {
  vi.useFakeTimers()
})
const proto = HTMLElement.prototype as unknown as Record<string, unknown>
afterEach(() => {
  // happy-dom has no popovers; a stub must not outlive the test that set it, failed or not.
  delete proto['showPopover']
  delete proto['hidePopover']
  document.querySelectorAll('body > dialog').forEach((d) => d.remove())
  w?.unmount()
  w = undefined
  resetToastStore()
  toastHosts.value = []
  toastFocus.returnTarget = null
  vi.useRealTimers()
  vi.restoreAllMocks()
})
async function mountToaster(props: Record<string, unknown> = {}) {
  w = mount(BlToaster, { props, attachTo: document.body })
  await nextTick()
  await nextTick()
}
const flush = async () => {
  await nextTick()
  await nextTick()
}

describe('BlToaster', () => {
  it('shows at most max and queues the rest FIFO', async () => {
    await mountToaster({ max: 2 })
    const a = toast('A')
    toast('B')
    toast('C')
    await flush()
    expect(items().map((i) => i.get('.bl-toast__message').text())).toEqual(['A', 'B'])
    dismiss(a)
    await flush()
    expect(items().map((i) => i.get('.bl-toast__message').text())).toEqual(['B', 'C'])
  })

  it('auto-dismisses after 5000ms; action toasts and duration 0 stay', async () => {
    await mountToaster()
    toast('Saved')
    toast({ message: 'Deleted', action: { label: 'Undo', onClick: () => {} } })
    toast({ message: 'Sticky', duration: 0 })
    await flush()
    vi.advanceTimersByTime(5000)
    await flush()
    expect(items().map((i) => i.get('.bl-toast__message').text())).toEqual(['Deleted', 'Sticky'])
  })

  it('pauses timers on mouse hover and resumes with the remaining time', async () => {
    await mountToaster()
    toast('Saved')
    await flush()
    vi.advanceTimersByTime(3000)
    const section = w!.get('.bl-toaster')
    section.element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
    vi.advanceTimersByTime(10000)
    await flush()
    expect(items()).toHaveLength(1)
    section.element.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
    vi.advanceTimersByTime(1999)
    await flush()
    expect(items()).toHaveLength(1)
    vi.advanceTimersByTime(1)
    await flush()
    expect(items()).toHaveLength(0)
  })

  it('ignores touch hover', async () => {
    await mountToaster()
    toast('Saved')
    await flush()
    w!
      .get('.bl-toaster')
      .element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }))
    vi.advanceTimersByTime(5000)
    await flush()
    expect(items()).toHaveLength(0)
  })

  it('routes speech by tone, appends repeats, and announces queued toasts when shown', async () => {
    await mountToaster({ max: 1 })
    const first = toast('Copied')
    const second = toast('Copied')
    toast({ message: 'Failed', tone: 'danger' })
    await flush()
    expect(spoken('status')).toEqual(['Copied'])
    dismiss(first)
    await flush()
    expect(spoken('status')).toEqual(['Copied', 'Copied'])
    dismiss(second)
    await flush()
    expect(spoken('alert')).toEqual(['Failed'])
  })

  it('marks both live regions non-atomic, so only the appended line is spoken', async () => {
    await mountToaster()
    expect(w!.get('[role="status"]').attributes('aria-atomic')).toBe('false')
    expect(w!.get('[role="alert"]').attributes('aria-atomic')).toBe('false')
  })

  it('speaks a toast fired as a dialog closes only once the toaster has moved out', async () => {
    await mountToaster()
    const dialog = document.createElement('dialog')
    const host = document.createElement('div')
    dialog.append(host)
    document.body.append(dialog)
    dialog.showModal()
    pushToastHost(host)
    await flush()
    dialog.close() // closed, but its close event has not released the host yet
    toast('Saved')
    await flush()
    expect(host.querySelector('[role="status"]')!.textContent).toBe('')
    removeToastHost(host)
    await flush()
    const region = document.querySelector('.bl-toaster [role="status"]')!
    expect(region.closest('dialog')).toBeNull()
    expect(region.textContent).toBe('Saved')
    dialog.remove()
  })

  it('speaks a toast fired during a dialog exit only once the toaster has moved out', async () => {
    await mountToaster()
    const dialog = document.createElement('dialog')
    const host = document.createElement('div')
    dialog.append(host)
    document.body.append(dialog)
    dialog.showModal()
    pushToastHost(host)
    await flush()
    dialog.setAttribute('data-closing', '') // still open and modal, fading out
    toast('Saved')
    await flush()
    expect(host.querySelector('[role="status"]')!.textContent).toBe('')
    removeToastHost(host)
    dialog.close()
    await flush()
    const region = document.querySelector('.bl-toaster [role="status"]')!
    expect(region.closest('dialog')).toBeNull()
    expect(region.textContent).toBe('Saved')
    dialog.remove()
  })

  it('speaks a toast held back by an exit once the dialog reopens instead', async () => {
    await mountToaster()
    const dialog = document.createElement('dialog')
    const host = document.createElement('div')
    dialog.append(host)
    document.body.append(dialog)
    dialog.showModal()
    pushToastHost(host)
    await flush()
    dialog.setAttribute('data-closing', '')
    toast('Saved')
    await flush()
    expect(host.querySelector('[role="status"]')!.textContent).toBe('')
    // reopened before the exit ended: the session settles and the same host returns, in one tick
    dialog.removeAttribute('data-closing')
    removeToastHost(host)
    pushToastHost(host)
    await flush()
    expect(host.querySelector('[role="status"]')!.textContent).toBe('Saved')
    dialog.remove()
  })

  it('rides in the top layer while the dialog it left is still fading out', async () => {
    await mountToaster()
    const shown: boolean[] = []
    proto['showPopover'] = () => shown.push(true)
    const dialog = document.createElement('dialog')
    const host = document.createElement('div')
    dialog.append(host)
    document.body.append(dialog)
    dialog.showModal()
    pushToastHost(host)
    toast('Copied')
    await flush()
    let end!: () => void
    const exit = {
      transitionProperty: 'opacity',
      effect: { getComputedTiming: () => ({ duration: 200 }) },
      finished: new Promise<void>((r) => (end = r))
    }
    dialog.getAnimations = () => [exit as unknown as Animation]
    dialog.close() // a real browser keeps it painted, backdrop and all, until `exit` ends
    removeToastHost(host)
    await flush()
    const section = document.querySelector<HTMLElement>('.bl-toaster')!
    expect(section.closest('dialog')).toBeNull()
    expect(section.getAttribute('popover')).toBe('manual')
    expect(shown).toEqual([true])
    end()
    await flush()
    expect(section.hasAttribute('popover')).toBe(false) // removing it also hides it
  })

  it('stays in place when the dialog it left closed at once or in a blink', async () => {
    await mountToaster()
    const show = vi.fn()
    proto['showPopover'] = show
    const dialog = document.createElement('dialog')
    const host = document.createElement('div')
    dialog.append(host)
    document.body.append(dialog)
    dialog.showModal()
    pushToastHost(host)
    await flush()
    // reduced motion: base.css's 0.01ms transition, finished before anyone could see it
    const blink = {
      transitionProperty: 'display',
      effect: { getComputedTiming: () => ({ duration: 0.01 }) },
      finished: Promise.resolve()
    }
    dialog.getAnimations = () => [blink as unknown as Animation]
    dialog.close()
    removeToastHost(host)
    await flush()
    expect(show).not.toHaveBeenCalled()
    expect(document.querySelector('.bl-toaster')!.hasAttribute('popover')).toBe(false)
  })

  it('stops a deferred announcement watcher when the toaster unmounts', async () => {
    await mountToaster()
    const dialog = document.createElement('dialog')
    const host = document.createElement('div')
    dialog.append(host)
    document.body.append(dialog)
    dialog.showModal()
    pushToastHost(host)
    await flush()
    dialog.close()
    toast('Saved') // speak() now waits on the host change
    await flush()
    w!.unmount()
    w = undefined
    // A live watcher keeps the computed host, and so toastHosts, subscribed.
    expect((toastHosts as unknown as { dep: { subs?: unknown } }).dep.subs).toBeUndefined()
    expect(() => removeToastHost(host)).not.toThrow()
    await flush()
    expect(document.querySelector('[role="status"]')).toBeNull()
    dialog.remove()
  })

  it('adds the action hint to the announcement', async () => {
    await mountToaster()
    toast({ message: 'Deleted', action: { label: 'Undo', onClick: () => {} } })
    await flush()
    expect(spoken('status')).toEqual(['Deleted, Undo available'])
  })

  it('replaces by id in place, restarts the timer, re-announces only a changed message', async () => {
    await mountToaster()
    toast({ id: 'net', message: 'Connecting' })
    await flush()
    vi.advanceTimersByTime(4000)
    toast({ id: 'net', message: 'Connecting' })
    await flush()
    expect(spoken('status')).toEqual(['Connecting']) // same message: not re-announced
    vi.advanceTimersByTime(4000)
    await flush()
    expect(items()).toHaveLength(1) // restarted
    toast({ id: 'net', message: 'Connected', tone: 'success' })
    await flush()
    // the first announcement's <p> was removed at 7s
    expect(spoken('status')).toEqual(['Connected'])
    expect(items()[0]!.classes()).toContain('bl-toast--success')
  })

  it('runs an action then dismisses, even when it throws', async () => {
    await mountToaster()
    toast({
      message: 'Deleted',
      action: {
        label: 'Undo',
        onClick: () => {
          throw new Error('boom')
        }
      }
    })
    await flush()
    const handler = vi.fn()
    window.addEventListener('error', handler)
    await w!
      .get('.bl-toast__action')
      .trigger('click')
      .catch(() => {})
    await flush()
    expect(items()).toHaveLength(0)
    window.removeEventListener('error', handler)
  })

  it('moves focus to the next toast when the focused one is dismissed, and keeps it on replace', async () => {
    await mountToaster()
    toast({ id: 'a', message: 'A', duration: 0 })
    toast({ id: 'b', message: 'B', duration: 0 })
    await flush()
    const firstDismiss = items()[0]!.get('.bl-toast__dismiss').element as HTMLElement
    firstDismiss.focus()
    toast({ id: 'a', message: 'A2', duration: 0 })
    await flush()
    expect(document.activeElement).toBe(firstDismiss)
    await items()[0]!.get('.bl-toast__dismiss').trigger('click')
    await flush()
    expect(document.activeElement).toBe(items()[0]!.get('.bl-toast__dismiss').element)
  })

  it('returns focus to where it came from when the last toast goes', async () => {
    const before = document.createElement('button')
    document.body.prepend(before)
    await mountToaster()
    toast({ message: 'Only', duration: 0 })
    await flush()
    const dismissBtn = items()[0]!.get('.bl-toast__dismiss').element as HTMLElement
    before.focus()
    dismissBtn.focus() // focusin with relatedTarget = before
    w!
      .get('.bl-toaster')
      .element.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: before }))
    clear()
    await flush()
    expect(document.activeElement).toBe(before)
    // the toaster is no longer "focused": later toasts still expire
    toast('Next')
    await flush()
    vi.advanceTimersByTime(5000)
    await flush()
    expect(items()).toHaveLength(0)
    before.remove()
  })

  it('returns focus to where it was before the toast when an action opens a dialog', async () => {
    const before = document.createElement('button')
    document.body.prepend(before)
    const open = ref(false)
    const Host = defineComponent({
      setup() {
        return () => [
          h(BlDialog, {
            open: open.value,
            'onUpdate:open': (v: boolean) => (open.value = v),
            title: 'Details'
          }),
          h(BlToaster)
        ]
      }
    })
    w = mount(Host, { attachTo: document.body })
    await flush()
    toast({
      message: 'Update ready',
      action: { label: 'Details', onClick: () => (open.value = true) }
    })
    await flush()
    const action = w.get('.bl-toast__action').element as HTMLElement
    before.focus()
    action.focus()
    w.get('.bl-toaster').element.dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, relatedTarget: before })
    )
    expect(toastFocus.returnTarget).toBe(before)
    // The action opens the dialog; runAction then dismisses its toast, taking the opener along.
    await w.get('.bl-toast__action').trigger('click')
    await flush()
    expect(w.find('.bl-toast').exists()).toBe(false)
    w.get<HTMLElement>('.bl-dialog__close').element.focus()
    await w.get('.bl-dialog__close').trigger('click')
    await flush()
    expect(document.activeElement).toBe(before)
    before.remove()
  })

  it('replaces a queued toast in place, keeping its queue position', async () => {
    await mountToaster({ max: 1 })
    const a = toast('A')
    toast({ id: 'q', message: 'Q1' })
    toast('C')
    toast({ id: 'q', message: 'Q2' })
    await flush()
    dismiss(a)
    await flush()
    expect(items().map((i) => i.get('.bl-toast__message').text())).toEqual(['Q2'])
  })

  it('honours an explicit duration', async () => {
    await mountToaster()
    toast({ message: 'Brief', duration: 2000 })
    await flush()
    vi.advanceTimersByTime(1999)
    await flush()
    expect(items()).toHaveLength(1)
    vi.advanceTimersByTime(1)
    await flush()
    expect(items()).toHaveLength(0)
  })

  it('pauses while focus is inside', async () => {
    await mountToaster()
    toast('Saved')
    await flush()
    ;(items()[0]!.get('.bl-toast__dismiss').element as HTMLElement).focus()
    vi.advanceTimersByTime(10000)
    await flush()
    expect(items()).toHaveLength(1)
  })

  it('keeps focus that an action moved itself', async () => {
    const target = document.createElement('input')
    document.body.append(target)
    await mountToaster()
    toast({ message: 'Deleted', action: { label: 'Undo', onClick: () => target.focus() } })
    await flush()
    ;(w!.get('.bl-toast__action').element as HTMLElement).focus()
    await w!.get('.bl-toast__action').trigger('click')
    await flush()
    expect(document.activeElement).toBe(target)
    target.remove()
  })

  it('teleports into the topmost dialog host and back', async () => {
    await mountToaster()
    const a = document.createElement('div')
    const b = document.createElement('div')
    document.body.append(a, b)
    pushToastHost(a)
    await flush()
    expect(a.querySelector('.bl-toaster')).not.toBeNull()
    pushToastHost(b)
    await flush()
    expect(b.querySelector('.bl-toaster')).not.toBeNull()
    removeToastHost(b)
    await flush()
    expect(a.querySelector('.bl-toaster')).not.toBeNull()
    removeToastHost(a)
    await flush()
    expect(a.querySelector('.bl-toaster')).toBeNull()
    a.remove()
    b.remove()
  })

  it('warns when a second toaster mounts', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await mountToaster()
    const second = mount(BlToaster, { attachTo: document.body })
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('BlToaster'))
    second.unmount()
  })

  it('renders an empty list and both regions on the server', async () => {
    toast('Before hydration')
    const html = await renderToString(createSSRApp(BlToaster))
    expect(html).not.toContain('bl-toast__message')
    expect(html).toContain('role="status"')
    expect(html).toContain('role="alert"')
  })
})
