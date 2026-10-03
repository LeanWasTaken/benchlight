<template>
  <div
    ref="container"
    class="bl-marquee"
    :data-overflowing="overflowing ? '' : undefined"
    :title="overflowing ? title : undefined"
  >
    <div ref="content" class="bl-marquee__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useMarquee } from '../composables/useMarquee'

  const props = defineProps<{ title?: string; contentKey?: unknown }>()
  const container = ref<HTMLElement | null>(null)
  const content = ref<HTMLElement | null>(null)
  const { overflowing, refresh } = useMarquee(container, content)

  watch(
    () => props.contentKey,
    () => refresh(),
    { flush: 'post' }
  )
  defineExpose({ refresh })
</script>
