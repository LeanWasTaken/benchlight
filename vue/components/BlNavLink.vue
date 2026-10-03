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
  import type { LinkProps } from '../types'

  const props = defineProps<LinkProps & { current?: boolean }>()
  const tag = computed(() => resolveTag(props.as, props.to, props.href, 'a'))
</script>
