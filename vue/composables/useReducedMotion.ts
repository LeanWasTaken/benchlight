import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** Ref that mirrors `prefers-reduced-motion: reduce`; `false` on the server and until mounted. */
export function useReducedMotion(): Ref<boolean> {
  const reduced = ref(false)
  let media: MediaQueryList | null = null
  const update = () => {
    reduced.value = media?.matches ?? false
  }
  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    update()
    media.addEventListener('change', update)
  })
  onBeforeUnmount(() => media?.removeEventListener('change', update))
  return reduced
}
