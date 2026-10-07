import { addToast, clearToasts, dismissToast } from '../internal/toastStore'
import type { ToastOptions } from '../types'

export function useToast(): {
  toast: (input: string | ToastOptions) => string
  dismiss: (id: string) => void
  clear: () => void
} {
  return { toast: addToast, dismiss: dismissToast, clear: clearToasts }
}
