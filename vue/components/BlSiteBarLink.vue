<template>
  <li :class="attrs.class" :style="attrs.style as StyleValue">
    <component :is="tag" v-bind="linkAttrs()" class="bl-site-bar__link">
      <slot />
    </component>
  </li>
</template>

<script setup lang="ts">
  import { computed, useAttrs, type StyleValue } from 'vue'
  import { currentValue, linkBindings, resolveTag } from '../internal/link'
  import type { LinkAs, LinkCurrent, LinkTo } from '../types'

  const props = defineProps<{ as?: LinkAs; to?: LinkTo; href?: string; current?: LinkCurrent }>()
  defineOptions({ inheritAttrs: false })
  const attrs = useAttrs()
  const ariaCurrent = computed(() => currentValue(props.current))
  const tag = computed(() => resolveTag(props.as, props.to, props.href, 'a'))
  // The link's attributes; class and style belong to the <li>, every other fallthrough attribute
  // and listener lands here. A function evaluated in render, so it re-runs on any attr change.
  function linkAttrs(): Record<string, unknown> {
    const rest = { ...attrs }
    delete rest.class
    delete rest.style
    return {
      ...linkBindings(tag.value, props.to, props.href),
      ...rest,
      ...(ariaCurrent.value ? { 'aria-current': ariaCurrent.value } : {})
    }
  }
</script>
