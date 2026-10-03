import {
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref
} from 'vue'

/**
 * Ref that is true once the page is scrolled past `threshold` px (a number, `false` to disable, a ref
 * or a getter, re-evaluated on change). `false` on the server and until mounted.
 */
export function useScrollLifted(threshold: MaybeRefOrGetter<number | false> = 24): Ref<boolean> {
  const lifted = ref(false)
  const update = () => {
    const limit = toValue(threshold)
    lifted.value = limit !== false && window.scrollY > limit
  }
  onMounted(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
  })
  // post-flush watchers never run on the server, so this stays SSR-safe
  watch(() => toValue(threshold), update, { flush: 'post' })
  onBeforeUnmount(() => window.removeEventListener('scroll', update))
  return lifted
}
