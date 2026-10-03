<template>
  <component
    :is="tag"
    v-bind="linkBindings(tag, to, href)"
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
