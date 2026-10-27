import { watch, type Ref } from 'vue'
import { clampPage } from './table'

/**
 * Emits a corrected page when total or pageSize leave it out of range, on mount and on change.
 * Only once data exists (total > 0): an empty or still-loading list leaves the page alone.
 */
export function useClampedPage(
  page: Ref<number>,
  total: () => number,
  pageSize: () => number
): void {
  watch(
    () => [total(), pageSize()] as const,
    ([count, size]) => {
      if (!size || count <= 0) return
      const next = clampPage(page.value, count, size)
      if (next !== page.value) page.value = next
    },
    { immediate: true }
  )
}
