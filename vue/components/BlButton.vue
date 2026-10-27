<template>
  <component
    :is="tag"
    v-bind="bindings"
    class="bl-btn"
    :class="{
      'bl-btn--secondary': variant === 'secondary',
      'bl-btn--danger': variant === 'danger',
      'bl-btn--ghost': variant === 'ghost',
      'bl-btn--pill': pill,
      'bl-btn--icon': iconOnly()
    }"
  >
    <span v-if="$slots['icon']" class="bl-btn__icon" aria-hidden="true"><slot name="icon" /></span>
    <Nodes :n="nodes()" />
  </component>
</template>

<script setup lang="ts">
  import { computed, onBeforeUpdate, shallowRef, useAttrs, useSlots, watchEffect } from 'vue'
  import type { VNode } from 'vue'
  import { hasContent } from '../internal/slots'
  import { isDev, warn } from '../internal/dev'
  import { linkBindings, resolveTag } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  const props = withDefaults(
    defineProps<{
      as?: LinkAs
      to?: LinkTo
      href?: string
      variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
      ariaLabel?: string
      pressed?: boolean
      pill?: boolean
      type?: 'button' | 'submit' | 'reset'
      disabled?: boolean
    }>(),
    // An undefined default keeps an absent `pressed` from casting to false. `as never` passes
    // exactOptionalPropertyTypes without `| undefined`, which would change the runtime prop check.
    { variant: 'primary', type: 'button', pressed: undefined as never }
  )

  const slots = useSlots()
  const attrs = useAttrs()

  // The default slot is evaluated once per render and reused for both the icon-only check
  // and the rendered content.
  let cache: VNode[] | undefined
  const iconOnlyState = shallowRef(false)
  const hasTextState = shallowRef(false)
  onBeforeUpdate(() => {
    cache = undefined
  })
  function nodes(): VNode[] {
    if (!cache) {
      cache = slots['default']?.() ?? []
      if (isDev) {
        hasTextState.value = hasContent(cache)
        iconOnlyState.value = Boolean(slots['icon']) && !hasTextState.value
      }
    }
    return cache
  }
  // Icon-only: the icon slot is filled and the default slot is empty or whitespace.
  function iconOnly(): boolean {
    return Boolean(slots['icon']) && !hasContent(nodes())
  }
  const Nodes = (p: { n?: VNode[] }) => p.n

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
    const name = props.ariaLabel === undefined ? {} : { 'aria-label': props.ariaLabel }
    if (tag.value === 'button') {
      return {
        ...linkBindings('button', props.to, props.href),
        ...name,
        type: props.type,
        disabled: props.disabled || undefined,
        'aria-pressed': props.pressed === undefined ? undefined : String(props.pressed)
      }
    }
    if (props.disabled) {
      return { ...name, 'aria-disabled': 'true', tabindex: '-1', onClickCapture: blockClick }
    }
    return { ...linkBindings(tag.value, props.to, props.href), ...name }
  })

  if (isDev) {
    // Per-instance flags keep each hint to one message.
    const warned = new Set<string>()
    const once = (key: string, message: string) => {
      if (warned.has(key)) return
      warned.add(key)
      warn(message)
    }
    watchEffect(
      () => {
        if (props.pressed !== undefined && tag.value !== 'button')
          once(
            'pressed',
            'BlButton: `pressed` is ignored on links; a link cannot be a toggle button.'
          )
        if (
          iconOnlyState.value &&
          props.ariaLabel === undefined &&
          attrs['aria-labelledby'] === undefined
        )
          once(
            'name',
            'BlButton: an icon-only button needs an `ariaLabel` (`aria-label`) or `aria-labelledby`.'
          )
        if (props.ariaLabel !== undefined && hasTextState.value)
          once(
            'label',
            'BlButton: `ariaLabel` replaces the visible text as the accessible name; use it for icon-only buttons.'
          )
      },
      { flush: 'post' }
    )
  }
</script>
