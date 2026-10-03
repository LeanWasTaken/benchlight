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
  import type { LinkProps } from '../types'

  const props = defineProps<LinkProps & { current?: boolean }>()
  const tag = computed(() => resolveTag(props.as, props.to, props.href, 'a'))
</script>
