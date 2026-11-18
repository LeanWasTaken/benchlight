import { onActivated, onBeforeUnmount, onDeactivated, onMounted, watch, type Ref } from 'vue'
import { playExit } from './exit'
import { lockPage, unlockPage } from './pageLock'
import { pushToastHost, removeToastHost, toastFocus } from './toastHosts'
import type { DialogCloseEvent, DialogCloseReason } from '../types'

export interface ModalOptions {
  el: Ref<HTMLDialogElement | undefined>
  toasts: Ref<HTMLElement | undefined>
  open: Ref<boolean>
  dismissible: () => boolean
  beforeShow?: () => void
  // The element whose transition times the exit (the dialog by default), and the content made
  // inert while it plays (so keys cannot reach a control in a closing dialog).
  exit?: () => Element | undefined
  inert?: () => (Element | null | undefined)[]
  emitClose: (payload: DialogCloseEvent) => void
}

// One modal session on a native <dialog>: showModal/close driven by `open`, the close reason,
// focus restore, page lock, toast host, the exit animation and KeepAlive/unmount safety. Shared
// by BlDialog and BlLightbox.
export function useModal(o: ModalOptions) {
  const { el, toasts, open } = o
  let isOpen = false
  let pendingReason: DialogCloseReason | null = null
  let opener: HTMLElement | null = null
  let fallback: HTMLElement | null = null
  let downOnBackdrop = false
  // Cancels the exit under way; set from the start of an animated close until it settles.
  let closing: (() => void) | null = null
  let reopening = false

  function stopExit(): void {
    closing?.()
    closing = null
  }

  function show(): void {
    const dialog = el.value
    if (!dialog) return
    if (closing) {
      // Reopened during the exit: close now and let the branch below settle that session.
      stopExit()
      reopening = true
      dialog.close()
      reopening = false
    }
    if (isOpen) {
      if (dialog.open) return
      // Closed earlier in this task, its close event still queued: finish that session now
      // (onClose ignores the late event once the dialog is open again), then reopen.
      finish(false)
    }
    o.beforeShow?.()
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // Opened from a toast action: that toast is dismissed right after, taking the opener with it.
    fallback = opener?.closest('.bl-toaster') ? toastFocus.returnTarget : null
    lockPage()
    // close() without an argument keeps the previous returnValue; never report a stale one.
    dialog.returnValue = ''
    // Without an autofocus target the browser would focus the ×, and WebKit then rings it even
    // after a mouse open. The dialog (tabindex="-1") takes focus instead; Tab still reaches the ×.
    // Nothing inside may be focused and blurred on the way (a field would commit, a tooltip
    // flash, blur validation run): autofocus on the dialog makes showModal() focus it directly
    // (the dialog focusing steps; Firefox, Safari), and children inert for the call leave
    // Chromium, which ignores that attribute, nothing inside to focus.
    const self = !dialog.hasAttribute('autofocus') && dialog.querySelector('[autofocus]') === null
    const held = self
      ? [...dialog.children].filter((c) => c instanceof HTMLElement && !c.inert)
      : []
    if (self) dialog.setAttribute('autofocus', '')
    for (const c of held) (c as HTMLElement).inert = true
    try {
      dialog.showModal()
    } finally {
      for (const c of held) (c as HTMLElement).inert = false
      if (self) dialog.removeAttribute('autofocus')
    }
    if (self && document.activeElement !== dialog) dialog.focus({ preventScroll: true })
    isOpen = true
    if (toasts.value) pushToastHost(toasts.value)
  }

  // Plays the exit while the dialog is still modal, then closes it; close() alone would drop it
  // from the top layer at once outside Chromium. Repeats during the exit are ignored.
  function closeWith(reason: DialogCloseReason): void {
    if (!isOpen || closing) return
    pendingReason = reason
    // Release the toast host at close(), not in the async close event: a toast fired in the same
    // tick (Save closes the dialog and toasts "Saved") must be spoken where the toaster lands
    // next. Not before close(): during the exit the dialog is still modal and the page inert, so
    // the toasts stay inside it (BlToaster holds back speech in a closing dialog until it moves).
    const host = toasts.value
    const release = () => {
      if (host) removeToastHost(host)
    }
    const dialog = el.value
    if (!dialog?.open) {
      release()
      dialog?.close()
      return
    }
    const done = () => {
      release()
      dialog.close()
    }
    const cancel = playExit(dialog, done, { target: o.exit?.(), inert: o.inert?.() })
    // Without an exit to wait for, close() may have settled the session already (happy-dom).
    if (isOpen) closing = cancel
    else cancel()
  }

  // Esc. Dismissible: animate the close and remember why; a cancel the browser will not let us
  // hold (non-cancelable) closes at once. Not dismissible: block it; if the browser refuses
  // (Chromium's anti-abuse makes cancel non-cancelable), the close proceeds as 'escape'.
  // During an exit the close is already under way with its reason: hold Esc, change nothing (a
  // non-cancelable one closes it now, still with that reason).
  function onCancel(event: Event): void {
    if (closing) {
      if (event.cancelable) event.preventDefault()
      return
    }
    if (o.dismissible()) {
      if (event.cancelable) {
        event.preventDefault()
        closeWith('escape')
      } else pendingReason = 'escape'
      return
    }
    event.preventDefault()
    pendingReason = event.cancelable ? null : 'escape'
  }

  // The only emitter. Fires for every way a dialog closes; happy-dom dispatches it synchronously.
  // An open dialog here means show() already finished this session and reopened.
  function onClose(): void {
    if (isOpen && !reopening && !el.value?.open) finish(true)
  }

  // Settles a session exactly once. A reopen (sync false) keeps v-model as the parent set it.
  function finish(sync: boolean): void {
    stopExit()
    isOpen = false
    const reason = pendingReason ?? 'native'
    pendingReason = null
    if (toasts.value) removeToastHost(toasts.value)
    unlockPage()
    if (sync && open.value) open.value = false
    o.emitClose({ reason, returnValue: el.value?.returnValue ?? '' })
    restoreFocus()
  }

  // Native <dialog> already restores focus; only step in when focus was lost, so a @close
  // handler that moves focus on purpose keeps its choice.
  function restoreFocus(): void {
    const active = document.activeElement
    const lost = !active || active === document.body || gone(active) || el.value?.contains(active)
    if (lost) returnTarget()?.focus({ preventScroll: true })
    opener = fallback = null
  }
  function returnTarget(): HTMLElement | null {
    if (opener && !gone(opener)) return opener
    return fallback && !gone(fallback) ? fallback : null
  }
  // Removed, or inside a toast that is animating out (still connected until its leave ends).
  function gone(node: Element): boolean {
    return !node.isConnected || node.closest('.bl-toast-leave-active') !== null
  }

  function onPointerDown(event: Event): void {
    downOnBackdrop = event.target === el.value
  }
  function onClick(event: MouseEvent): void {
    const backdrop = downOnBackdrop && event.target === el.value
    downOnBackdrop = false
    if (backdrop && o.dismissible()) closeWith('backdrop')
  }

  watch(open, (value) => {
    if (value) show()
    else closeWith('program')
  })
  onMounted(() => {
    if (open.value) show()
  })
  // KeepAlive: a deactivated open dialog releases the toast host and page lock, and closes at
  // once without a user-close event; activation shows it again while `open` still asks for it.
  let suspended = false
  onDeactivated(() => {
    if (!isOpen) return
    // A user close under way (`open` still true) is settled now, as if its exit had ended, so
    // activation does not reopen what the user closed. A program close is dropped as below.
    if (closing && open.value) {
      finish(true)
      el.value?.close()
      return
    }
    stopExit()
    suspended = true
    isOpen = false
    pendingReason = null
    if (toasts.value) removeToastHost(toasts.value)
    unlockPage()
    el.value?.close()
    opener = fallback = null
  })
  onActivated(() => {
    if (!suspended) return
    suspended = false
    if (open.value) show()
  })
  onBeforeUnmount(() => {
    if (!isOpen) return
    stopExit()
    isOpen = false
    if (toasts.value) removeToastHost(toasts.value)
    unlockPage()
    el.value?.close()
    returnTarget()?.focus({ preventScroll: true })
    opener = fallback = null
  })

  return { closeWith, onCancel, onClose, onPointerDown, onClick, isOpen: () => isOpen }
}
