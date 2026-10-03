<template>
  <component
    :is="as"
    v-bind="linkBindings(as, to, href)"
    class="bl-tabbar__item"
    :aria-current="current ? 'page' : undefined"
  >
    <span class="bl-tabbar__icon" aria-hidden="true"><slot name="icon" /></span>
    <span class="bl-tabbar__label"><slot /></span>
  </component>
</template>

<script setup lang="ts">
  import { linkBindings } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  withDefaults(defineProps<{ as?: LinkAs; to?: LinkTo; href?: string; current?: boolean }>(), {
    as: 'a'
  })
</script>
