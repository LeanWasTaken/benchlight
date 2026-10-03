import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export function useScrollLifted(threshold = 24): Ref<boolean> {
  const lifted = ref(false)
  const update = () => {
    lifted.value = window.scrollY > threshold
  }
  onMounted(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
  })
  onBeforeUnmount(() => window.removeEventListener('scroll', update))
  return lifted
}
