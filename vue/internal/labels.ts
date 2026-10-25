import type { LabelOverrides } from '../types'

// Overlay a partial set of labels on the defaults. An `undefined` value (an i18n lookup that
// found nothing, a conditional prop) falls back to the default instead of blanking the string.
export function mergeLabels<T extends object>(defaults: T, partial?: LabelOverrides<T> | null): T {
  const merged = { ...defaults }
  if (partial) {
    for (const key of Object.keys(partial) as (keyof T)[]) {
      const value = partial[key]
      if (value !== undefined) merged[key] = value as T[keyof T]
    }
  }
  return merged
}
