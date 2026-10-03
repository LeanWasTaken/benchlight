<template>
  <li>
    <component
      :is="tag"
      v-bind="linkBindings(tag, to, href)"
      class="bl-site-bar__link"
      :aria-current="current ? 'page' : undefined"
    >
      <slot />
    </component>
  </li>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { linkBindings, resolveTag } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  const props = defineProps<{ as?: LinkAs; to?: LinkTo; href?: string; current?: boolean }>()
  const tag = computed(() => resolveTag(props.as, props.to, props.href, 'a'))
</script>
