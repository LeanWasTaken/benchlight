import { onBeforeUnmount, onMounted, ref, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

export interface FollowScrollOptions {
  /** follow new content at all (default true) */
  enabled?: MaybeRefOrGetter<boolean>
  /** px from the bottom that still counts as "at the bottom" (default 4) */
  threshold?: number
}

// Keeps a scroll container at the bottom only while the reader is already there.
export function useFollowScroll(
  el: Ref<HTMLElement | null>,
  { enabled = true, threshold = 4 }: FollowScrollOptions = {}
): { pinned: Ref<boolean>; toBottom: () => void } {
  const pinned = ref(true)

  function measure(): void {
    const node = el.value
    if (!node) return
    pinned.value = node.scrollHeight - node.scrollTop - node.clientHeight <= threshold
  }

  function toBottom(): void {
    const node = el.value
    if (node && toValue(enabled) && pinned.value) node.scrollTop = node.scrollHeight
  }

  let bound: HTMLElement | null = null
  onMounted(() => {
    bound = el.value
    bound?.addEventListener('scroll', measure, { passive: true })
    // start truthful: a followed log opens on its newest lines, anything else reports where it is
    if (bound && toValue(enabled)) bound.scrollTop = bound.scrollHeight
    measure()
  })
  onBeforeUnmount(() => bound?.removeEventListener('scroll', measure))

  return { pinned, toBottom }
}
