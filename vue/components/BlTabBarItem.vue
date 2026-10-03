<template>
  <component
    :is="tag"
    v-bind="linkBindings(tag, to, href)"
    class="bl-tabbar__item"
    :aria-current="current ? 'page' : undefined"
  >
    <span class="bl-tabbar__icon" aria-hidden="true"><slot name="icon" /></span>
    <span class="bl-tabbar__label"><slot /></span>
  </component>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { linkBindings, resolveTag } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  const props = defineProps<{ as?: LinkAs; to?: LinkTo; href?: string; current?: boolean }>()
  const tag = computed(() => resolveTag(props.as, props.to, props.href, 'a'))
</script>
