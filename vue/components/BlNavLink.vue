<template>
  <li>
    <component
      :is="as"
      v-bind="linkBindings(as, to, href)"
      class="bl-site-bar__link"
      :aria-current="current ? 'page' : undefined"
    >
      <slot />
    </component>
  </li>
</template>

<script setup lang="ts">
  import { linkBindings } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  withDefaults(defineProps<{ as?: LinkAs; to?: LinkTo; href?: string; current?: boolean }>(), {
    as: 'a'
  })
</script>
