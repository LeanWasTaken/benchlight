<template>
  <span ref="root" class="bl-eq" :class="{ 'bl-eq--active': active }" aria-hidden="true">
    <span v-for="bar in 4" :key="bar" class="bl-eq__bar" />
  </span>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { cssTime } from '../internal/cssTime'

  const props = defineProps<{ active?: boolean }>()
  const root = ref<HTMLElement | null>(null)

  // Taking the loop away would snap each bar back to full height. Stopping glides it from
  // wherever the loop was: a short, finite animation (it ends, and runs on the compositor).
  watch(
    () => props.active,
    (active, was) => {
      const bars = root.value?.querySelectorAll<HTMLElement>('.bl-eq__bar')
      if (!was || active || !bars || !window.matchMedia) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const fast = cssTime(
        getComputedStyle(root.value!).getPropertyValue('--bl-duration-fast'),
        150
      )
      for (const bar of bars) {
        const from = getComputedStyle(bar).transform
        if (from && from !== 'none')
          bar.animate?.([{ transform: from }, { transform: 'none' }], {
            duration: fast,
            easing: 'ease'
          })
      }
    },
    { flush: 'sync' }
  )
</script>
