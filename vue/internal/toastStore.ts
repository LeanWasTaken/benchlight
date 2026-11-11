import { reactive } from 'vue'
import type { ToastAction, ToastOptions, ToastTone } from '../types'

export interface ToastRecord {
  id: string
  // internal, for element ids: user ids may contain spaces or quotes
  key: number
  message: string
  tone: ToastTone
  action?: ToastAction | undefined
  duration: number
  // bumped when an id is re-toasted, so the toaster restarts its timer
  version: number
}

// One store per JS realm, data only: the mounted BlToaster owns timers, focus and speech.
export const toastState = reactive({ items: [] as ToastRecord[], cleared: 0, toasters: 0 })
let counter = 0
let keys = 0

const MAX_DELAY = 2 ** 31 - 1

// Non-finite or non-positive durations are persistent (0); huge ones are clamped to the timer limit.
export function normDuration(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.min(value, MAX_DELAY) : 0
}

export function addToast(input: string | ToastOptions): string {
  if (typeof window === 'undefined') return ''
  const o: ToastOptions = typeof input === 'string' ? { message: input } : input
  const record: ToastRecord = {
    id: o.id ?? `bl-toast-${++counter}`,
    key: ++keys,
    message: o.message,
    tone: o.tone ?? 'neutral',
    action: o.action,
    duration: normDuration(o.duration ?? (o.action ? 0 : 5000)),
    version: 0
  }
  const i = toastState.items.findIndex((t) => t.id === record.id)
  if (i >= 0) {
    record.version = toastState.items[i]!.version + 1
    record.key = toastState.items[i]!.key
    toastState.items.splice(i, 1, record)
  } else toastState.items.push(record)
  return record.id
}

export function dismissToast(id: string): void {
  const i = toastState.items.findIndex((t) => t.id === id)
  if (i >= 0) toastState.items.splice(i, 1)
}

export function clearToasts(): void {
  toastState.items.splice(0)
  toastState.cleared++
}

export function resetToastStore(): void {
  toastState.items.splice(0)
  toastState.cleared = 0
  toastState.toasters = 0
  counter = 0
  keys = 0
}
