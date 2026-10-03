<template>
  <component
    :is="as"
    v-bind="linkBindings(as, to, href)"
    class="bl-link-arrow"
    :class="{ 'bl-link-arrow--quiet': quiet }"
  >
    <span v-if="direction === 'left'" class="bl-link-arrow__icon" aria-hidden="true">
      <slot name="icon">←</slot>
    </span>
    <slot />
    <span v-if="direction !== 'left'" class="bl-link-arrow__icon" aria-hidden="true">
      <slot name="icon">{{ direction === 'up-right' ? '↗' : '→' }}</slot>
    </span>
  </component>
</template>

<script setup lang="ts">
  import { linkBindings } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  withDefaults(
    defineProps<{
      as?: LinkAs
      to?: LinkTo
      href?: string
      direction?: 'left' | 'right' | 'up-right'
      quiet?: boolean
    }>(),
    { as: 'a', direction: 'right' }
  )
</script>
