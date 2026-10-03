<template>
  <component
    :is="tag"
    v-bind="bindings"
    class="kd-btn"
    :class="{
      'kd-btn--secondary': variant === 'secondary',
      'kd-btn--danger': variant === 'danger',
      'kd-btn--pill': pill
    }"
  >
    <span v-if="$slots.icon" class="kd-btn__icon" aria-hidden="true"><slot name="icon" /></span>
    <slot />
  </component>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { linkBindings } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  const props = withDefaults(
    defineProps<{
      variant?: 'primary' | 'secondary' | 'danger'
      pill?: boolean
      as?: LinkAs
      to?: LinkTo
      href?: string
      type?: 'button' | 'submit' | 'reset'
      disabled?: boolean
    }>(),
    { variant: 'primary', type: 'button' }
  )

  const tag = computed<LinkAs>(() => props.as ?? (props.href || props.to ? 'a' : 'button'))
  const bindings = computed(() => {
    if (tag.value === 'button') return { type: props.type, disabled: props.disabled || undefined }
    return {
      ...linkBindings(tag.value, props.to, props.href),
      'aria-disabled': props.disabled ? 'true' : undefined
    }
  })
</script>
