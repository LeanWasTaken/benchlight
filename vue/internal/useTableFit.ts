import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export const FIT_HYSTERESIS = 8

// Stack when the table needs more than the available width; unstack only once it fits with
// a margin, so a width near the boundary cannot flip the layout back and forth.
export function decideStacked(
  stacked: boolean,
  need: number,
  avail: number,
  hysteresis = FIT_HYSTERESIS
): boolean {
  return stacked ? need > avail - hysteresis : need > avail
}

export function useTableFit(
  root: Ref<HTMLElement | null>,
  table: Ref<HTMLElement | null>,
  scroller: Ref<HTMLElement | null>,
  options: { enabled: () => boolean; deps: () => unknown }
): {
  stacked: Ref<boolean>
  fitted: Ref<boolean>
  overflowing: Ref<boolean>
  measure: () => void
} {
  const stacked = ref(false)
  const fitted = ref(false)
  const overflowing = ref(false)
  let frame = 0
  let lastInline = -1
  let observer: ResizeObserver | undefined
  // Latest decision, kept apart from `stacked` (written only in the frame) so hysteresis
  // reads the newest decision when several measures land before one frame.
  let decided = false
  let disposed = false

  function apply(next: boolean, overflow: boolean): void {
    if (frame) cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      stacked.value = next
      overflowing.value = overflow
    })
  }

  // Synchronous within one task: the measuring styles never paint.
  function measure(): void {
    if (disposed) return
    const el = root.value
    const t = table.value
    if (!el || !t) return
    if (!options.enabled()) {
      const s = scroller.value
      decided = false
      apply(false, !!s && s.scrollWidth > s.clientWidth + 1)
      return
    }
    // Measure in the unstacked layout; restored within the same task, so nothing paints.
    const wasStacked = el.hasAttribute('data-stacked')
    if (wasStacked) el.removeAttribute('data-stacked')
    el.setAttribute('data-measuring', '')
    const need = t.getBoundingClientRect().width
    if (wasStacked) {
      // Restore the stacked layout while data-measuring still kills transitions, and flush it.
      // Otherwise the next style change runs from the unstacked measuring layout, and under
      // reduced motion (0.01ms transitions) its first frame paints the table at that height.
      el.setAttribute('data-stacked', '')
      void el.offsetWidth
    }
    el.removeAttribute('data-measuring')
    const style = getComputedStyle(el)
    const avail =
      el.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0)
    decided = decideStacked(decided, need, avail)
    apply(decided, false)
  }

  watch(options.deps, measure, { flush: 'post' })

  onMounted(() => {
    fitted.value = true
    measure()
    if (root.value) {
      const cs = getComputedStyle(root.value)
      lastInline =
        root.value.clientWidth -
        (parseFloat(cs.paddingLeft) || 0) -
        (parseFloat(cs.paddingRight) || 0)
    }
    if (typeof ResizeObserver !== 'undefined' && root.value) {
      observer = new ResizeObserver((entries) => {
        const box = (entries[0] as ResizeObserverEntry | undefined)?.contentBoxSize?.[0]
        const inline = box?.inlineSize ?? root.value?.clientWidth ?? -1
        if (inline === lastInline) return
        lastInline = inline
        measure()
      })
      observer.observe(root.value)
    }
    document.fonts?.ready.then(measure).catch(() => {})
  })

  onBeforeUnmount(() => {
    disposed = true
    observer?.disconnect()
    if (frame) cancelAnimationFrame(frame)
  })

  return { stacked, fitted, overflowing, measure }
}
