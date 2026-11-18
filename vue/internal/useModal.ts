import { onActivated, onBeforeUnmount, onDeactivated, onMounted, watch, type Ref } from 'vue'
import { lockPage, unlockPage } from './pageLock'
import { pushToastHost, removeToastHost, toastFocus } from './toastHosts'
import type { DialogCloseEvent, DialogCloseReason } from '../types'

export interface ModalOptions {
  el: Ref<HTMLDialogElement | undefined>
  toasts: Ref<HTMLElement | undefined>
  open: Ref<boolean>
  dismissible: () => boolean
  beforeShow?: () => void
  emitClose: (payload: DialogCloseEvent) => void
}

// One modal session on a native <dialog>: showModal/close driven by `open`, the close reason,
// focus restore, page lock, toast host and KeepAlive/unmount safety. Shared by BlDialog and
// BlLightbox.
export function useModal(o: ModalOptions) {
  const { el, toasts, open } = o
  let isOpen = false
  let pendingReason: DialogCloseReason | null = null
  let opener: HTMLElement | null = null
  let fallback: HTMLElement | null = null
  let downOnBackdrop = false

  function show(): void {
    const dialog = el.value
    if (!dialog) return
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
    dialog.showModal()
    isOpen = true
    if (toasts.value) pushToastHost(toasts.value)
  }

  function closeWith(reason: DialogCloseReason): void {
    if (!isOpen) return
    pendingReason = reason
    // Release the toast host now, not in the async close event: a toast fired in the same tick
    // (Save closes the dialog and toasts "Saved") must be spoken where the toaster lands next.
    if (toasts.value) removeToastHost(toasts.value)
    el.value?.close()
  }

  // Esc. Dismissible: let it close and remember why. Not dismissible: block it; if the browser
  // refuses (Chromium's anti-abuse makes cancel non-cancelable), the close proceeds as 'escape'.
  function onCancel(event: Event): void {
    if (o.dismissible()) {
      pendingReason = 'escape'
      return
    }
    event.preventDefault()
    pendingReason = event.cancelable ? null : 'escape'
  }

  // The only emitter. Fires for every way a dialog closes; happy-dom dispatches it synchronously.
  // An open dialog here means show() already finished this session and reopened.
  function onClose(): void {
    if (isOpen && !el.value?.open) finish(true)
  }

  // Settles a session exactly once. A reopen (sync false) keeps v-model as the parent set it.
  function finish(sync: boolean): void {
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
  // KeepAlive: a deactivated open dialog releases the toast host and page lock, and closes
  // without a user-close event; activation shows it again while `open` still asks for it.
  let suspended = false
  onDeactivated(() => {
    if (!isOpen) return
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
    isOpen = false
    if (toasts.value) removeToastHost(toasts.value)
    unlockPage()
    el.value?.close()
    returnTarget()?.focus({ preventScroll: true })
    opener = fallback = null
  })

  return { closeWith, onCancel, onClose, onPointerDown, onClick, isOpen: () => isOpen }
}
