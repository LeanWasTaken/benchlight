<template>
  <nav v-if="prev || next" class="bl-prev-next" :aria-label="text.nav">
    <component
      :is="as"
      v-if="prev"
      v-bind="linkBindings(as, prev.to, prev.href)"
      class="bl-prev-next__link bl-prev-next__link--prev"
    >
      <span class="bl-prev-next__label">
        <span class="bl-prev-next__icon">
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M10 6H2M5.5 2.5 2 6l3.5 3.5" />
          </svg>
        </span>
        {{ text.prev }}
      </span>
      <span class="bl-prev-next__title">{{ prev.title }}</span>
    </component>
    <span v-else />
    <component
      :is="as"
      v-if="next"
      v-bind="linkBindings(as, next.to, next.href)"
      class="bl-prev-next__link bl-prev-next__link--next"
    >
      <span class="bl-prev-next__label">
        {{ text.next }}
        <span class="bl-prev-next__icon">
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M2 6h8M6.5 2.5 10 6 6.5 9.5" />
          </svg>
        </span>
      </span>
      <span class="bl-prev-next__title">{{ next.title }}</span>
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
