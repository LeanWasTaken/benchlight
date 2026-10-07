import { shallowRef } from 'vue'

// Elements a BlToaster renders into while modal dialogs are open (a modal makes everything
// outside it inert). The last entry is the topmost dialog.
export const toastHosts = shallowRef<HTMLElement[]>([])

export function pushToastHost(el: HTMLElement): void {
  toastHosts.value = [...toastHosts.value.filter((h) => h !== el), el]
}

export function removeToastHost(el: HTMLElement): void {
  toastHosts.value = toastHosts.value.filter((h) => h !== el)
}

// Where focus was before it entered the toaster. A dialog opened from a toast action falls back
// to it on close, because the action's toast (the dialog's opener) is gone by then.
export const toastFocus: { returnTarget: HTMLElement | null } = { returnTarget: null }
