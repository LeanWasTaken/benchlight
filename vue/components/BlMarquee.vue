<template>
  <div class="bl-marquee" :data-overflowing="overflowing ? '' : undefined" :title="shownTitle">
    <div ref="container" class="bl-marquee__viewport">
      <div ref="content" class="bl-marquee__content">
        <slot />
      </div>
    </div>
    <button
      v-if="stoppable"
      type="button"
      class="bl-marquee__toggle"
      :aria-pressed="paused ? 'true' : 'false'"
      :aria-label="text.pause"
      @click="paused = !paused"
    />
  </div>
</template>

<script setup lang="ts">
  // The scrolling text is never a button: the slot may hold links, and interactive content inside
  // a button is invalid. A real <button> beside it stops the scroll (WCAG 2.2.2); hover and focus
  // inside the text hold it too.
  import { computed, ref, watch } from 'vue'
  import { useMarquee } from '../composables/useMarquee'
  import { useReducedMotion } from '../composables/useReducedMotion'
  import { mergeLabels } from '../internal/labels'
  import type { LabelOverrides, MarqueeLabels } from '../types'

  const props = defineProps<{
    title?: string
    contentKey?: unknown
    labels?: Partial<LabelOverrides<MarqueeLabels>>
  }>()
  // Controlled with `v-model:paused` or `:paused`, internal otherwise; updates only on user toggles.
  const paused = defineModel<boolean>('paused', { default: false })
  const container = ref<HTMLElement | null>(null)
  const content = ref<HTMLElement | null>(null)
  const reduced = useReducedMotion()
  const text = computed<MarqueeLabels>(() =>
    mergeLabels({ pause: 'Pause scrolling' }, props.labels)
  )
  const { overflowing, refresh } = useMarquee(container, content, { paused: () => paused.value })
  // A stop control only where text actually moves; reduced motion wraps it instead.
  const stoppable = computed(() => overflowing.value && !reduced.value)
  const shownTitle = computed(() => (overflowing.value ? props.title : undefined))

  watch(
    () => props.contentKey,
    () => refresh(),
    { flush: 'post' }
  )
  defineExpose({ refresh })
</script>
