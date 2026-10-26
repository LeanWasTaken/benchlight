<template>
  <li class="bl-index__item" :class="attrs.class" :style="attrs.style as StyleValue">
    <component
      :is="tag"
      v-bind="linkAttrs()"
      class="bl-index-row"
      :class="{ 'bl-index-row--compact': compact }"
    >
      <span v-if="$slots['icon']" class="bl-index-row__icon" aria-hidden="true">
        <slot name="icon" />
      </span>
      <span v-if="$slots['meta']" class="bl-index-row__meta"><slot name="meta" /></span>
      <span class="bl-index-row__title"><slot name="title" /></span>
      <span v-if="$slots['default']" class="bl-index-row__desc"><slot /></span>
    </component>
  </li>
</template>

<script setup lang="ts">
  import { computed, useAttrs, type StyleValue } from 'vue'
  import { linkBindings, resolveTag } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  const props = defineProps<{
    as?: LinkAs
    to?: LinkTo
    href?: string
    current?: boolean | 'page' | 'step' | 'location' | 'true'
    compact?: boolean
  }>()

  defineOptions({ inheritAttrs: false })
  const attrs = useAttrs()
  const ariaCurrent = computed(() => (props.current === true ? 'true' : props.current || undefined))
  const tag = computed(() => resolveTag(props.as, props.to, props.href, 'div'))
  const bindings = computed(() => {
    if (tag.value === 'div') return linkBindings('div', props.to, props.href)
    if (tag.value === 'button')
      return { ...linkBindings('button', props.to, props.href), type: 'button' }
    return linkBindings(tag.value, props.to, props.href)
  })
  // The link's attributes; class and style belong to the <li>, every other fallthrough attribute
  // and listener lands here. A function evaluated in render, so it re-runs on any attr change.
  function linkAttrs(): Record<string, unknown> {
    const rest = { ...attrs }
    delete rest.class
    delete rest.style
    return {
      ...bindings.value,
      ...rest,
      ...(ariaCurrent.value ? { 'aria-current': ariaCurrent.value } : {})
    }
  }
</script>
