import { onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

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
  function unbind(): void {
    bound?.removeEventListener('scroll', measure)
    bound = null
  }
  // post-flush watchers never run on the server, so this stays SSR-safe
  watch(
    el,
    (node) => {
      unbind()
      bound = node
      if (!node) return
      node.addEventListener('scroll', measure, { passive: true })
      // start truthful: a followed log opens on its newest lines, anything else reports where it is
      if (toValue(enabled)) node.scrollTop = node.scrollHeight
      measure()
    },
    { immediate: true, flush: 'post' }
  )
  onBeforeUnmount(unbind)

  return { pinned, toBottom }
}
