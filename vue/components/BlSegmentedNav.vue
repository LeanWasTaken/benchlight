<template>
  <nav class="bl-segmented" :class="{ 'bl-segmented--compact': compact }" :aria-label="ariaLabel">
    <component
      :is="tagFor(item)"
      v-for="(item, index) in items"
      :key="index"
      v-bind="linkBindings(tagFor(item), item.to, item.href)"
      class="bl-segmented__item"
      :aria-current="currentValue(item.current)"
    >
      {{ item.label }}
    </component>
  </nav>
</template>

<script setup lang="ts">
  import { warnOnce } from '../internal/dev'
  import { currentValue, linkBindings } from '../internal/link'
  import type { LinkAs, SegmentedNavItem } from '../types'

  const props = defineProps<{
    items: SegmentedNavItem[]
    ariaLabel?: string
    linkAs?: LinkAs
    compact?: boolean
  }>()

  function tagFor(item: SegmentedNavItem): LinkAs {
    if (item.to === undefined && item.href === undefined) {
      warnOnce('BlSegmentedNav: an item has no to/href; every item must link somewhere.')
    }
    return item.as ?? props.linkAs ?? 'a'
  }
</script>
