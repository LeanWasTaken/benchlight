<template>
  <li class="kd-index__item">
    <component
      :is="tag"
      v-bind="bindings"
      class="kd-index-row"
      :class="{ 'kd-index-row--compact': compact }"
      :aria-current="selected ? 'true' : undefined"
    >
      <span v-if="$slots.icon" class="kd-index-row__icon" aria-hidden="true">
        <slot name="icon" />
      </span>
      <span v-if="$slots.meta" class="kd-index-row__meta"><slot name="meta" /></span>
      <span class="kd-index-row__title"><slot name="title" /></span>
      <span v-if="$slots.default" class="kd-index-row__desc"><slot /></span>
    </component>
  </li>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { linkBindings } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  const props = defineProps<{
    as?: LinkAs
    to?: LinkTo
    href?: string
    selected?: boolean
    compact?: boolean
  }>()

  const tag = computed<LinkAs>(() => props.as ?? (props.href || props.to ? 'a' : 'div'))
  const bindings = computed(() => {
    if (tag.value === 'div') return {}
    if (tag.value === 'button') return { type: 'button' }
    return linkBindings(tag.value, props.to, props.href)
  })
</script>
