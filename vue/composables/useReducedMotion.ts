import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

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
