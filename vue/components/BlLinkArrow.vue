<template>
  <component
    :is="tag"
    v-bind="linkBindings(tag, to, href)"
    class="bl-link-arrow"
    :class="{ 'bl-link-arrow--quiet': quiet }"
  >
    <span v-if="direction === 'left'" class="bl-link-arrow__icon" aria-hidden="true">
      <slot name="icon">
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
      </slot>
    </span>
    <slot />
    <span v-if="direction !== 'left'" class="bl-link-arrow__icon" aria-hidden="true">
      <slot name="icon">
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
          <path v-if="direction === 'up-right'" d="M3 9l6-6M4 3h5v5" />
          <path v-else d="M2 6h8M6.5 2.5 10 6 6.5 9.5" />
        </svg>
      </slot>
    </span>
  </component>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { linkBindings, resolveTag } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  const props = withDefaults(
    defineProps<{
      as?: LinkAs
      to?: LinkTo
      href?: string
      direction?: 'left' | 'right' | 'up-right'
      quiet?: boolean
    }>(),
    { direction: 'right' }
  )
  const tag = computed(() => resolveTag(props.as, props.to, props.href, 'a'))
</script>
