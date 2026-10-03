<template>
  <component
    :is="tag"
    v-bind="bindings"
    class="bl-btn"
    :class="{
      'bl-btn--secondary': variant === 'secondary',
      'bl-btn--danger': variant === 'danger',
      'bl-btn--pill': pill
    }"
  >
    <span v-if="$slots.icon" class="bl-btn__icon" aria-hidden="true"><slot name="icon" /></span>
    <slot />
  </component>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { linkBindings, resolveTag } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  const props = withDefaults(
    defineProps<{
      as?: LinkAs
      to?: LinkTo
      href?: string
      variant?: 'primary' | 'secondary' | 'danger'
      pill?: boolean
      type?: 'button' | 'submit' | 'reset'
      disabled?: boolean
    }>(),
    { variant: 'primary', type: 'button' }
  )

  function blockClick(event: MouseEvent): void {
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  const linkTag = computed<LinkAs>(() => resolveTag(props.as, props.to, props.href, 'button'))
  // A disabled link is rendered as a bare anchor so no router component receives a missing `to`.
  const tag = computed<LinkAs>(() =>
    props.disabled && linkTag.value !== 'button' ? 'a' : linkTag.value
  )
  const bindings = computed(() => {
    if (tag.value === 'button') {
      return {
        ...linkBindings('button', props.to, props.href),
        type: props.type,
        disabled: props.disabled || undefined
      }
    }
    if (props.disabled) {
      return { 'aria-disabled': 'true', tabindex: '-1', onClickCapture: blockClick }
    }
    return linkBindings(tag.value, props.to, props.href)
  })
</script>
