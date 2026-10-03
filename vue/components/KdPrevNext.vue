<template>
  <nav class="kd-prev-next" :aria-label="text.nav">
    <component
      :is="as"
      v-if="prev"
      v-bind="linkBindings(as, prev.to, prev.href)"
      class="kd-prev-next__link kd-prev-next__link--prev"
    >
      <span class="kd-prev-next__label">
        <span class="kd-prev-next__icon" aria-hidden="true">←</span>{{ text.prev }}
      </span>
      <span class="kd-prev-next__title">{{ prev.title }}</span>
    </component>
    <span v-else />
    <component
      :is="as"
      v-if="next"
      v-bind="linkBindings(as, next.to, next.href)"
      class="kd-prev-next__link kd-prev-next__link--next"
    >
      <span class="kd-prev-next__label">
        {{ text.next }}<span class="kd-prev-next__icon" aria-hidden="true">→</span>
      </span>
      <span class="kd-prev-next__title">{{ next.title }}</span>
    </component>
    <span v-else />
  </nav>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { linkBindings } from '../internal/link'
  import type { LinkAs, PrevNextItem, PrevNextLabels } from '../types'

  const props = withDefaults(
    defineProps<{
      prev?: PrevNextItem | null
      next?: PrevNextItem | null
      as?: LinkAs
      labels?: Partial<PrevNextLabels>
    }>(),
    { as: 'a' }
  )
  const text = computed<PrevNextLabels>(() => ({
    nav: 'Pagination',
    prev: 'Previous',
    next: 'Next',
    ...props.labels
  }))
</script>
