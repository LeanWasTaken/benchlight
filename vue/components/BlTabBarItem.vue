<template>
  <component
    :is="tag"
    v-bind="linkBindings(tag, to, href)"
    class="bl-tab-bar__item"
    :aria-current="currentValue(current)"
  >
    <span class="bl-tab-bar__icon" aria-hidden="true"><slot name="icon" /></span>
    <span class="bl-tab-bar__label"><slot /></span>
  </component>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { currentValue, linkBindings, resolveTag } from '../internal/link'
  import type { LinkAs, LinkCurrent, LinkTo } from '../types'

  const props = defineProps<{ as?: LinkAs; to?: LinkTo; href?: string; current?: LinkCurrent }>()
  const tag = computed(() => resolveTag(props.as, props.to, props.href, 'a'))
</script>
