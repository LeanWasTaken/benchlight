<template>
  <slot name="trigger" :bind="bind" />
  <div
    v-bind="$attrs"
    :id="tipId"
    ref="tip"
    class="bl-tooltip"
    popover="manual"
    role="tooltip"
    :data-side="side"
    :data-align="align"
    :style="panelAnchorStyle(uid)"
    @pointerenter="onTipEnter"
    @pointerleave="onLeave"
  >
    {{ text }}
  </div>
</template>

<script setup lang="ts">
  // A manual popover: the browser gives it no light dismiss, so every show and hide comes from
  // here. Hover waits `delay`, keyboard focus (:focus-visible) shows at once, touch never shows
  // on hover. Leaving the trigger starts a short grace so the pointer can cross onto the tooltip
  // (WCAG 1.4.13 hoverable); Esc hides it through a document listener that exists only while
  // it is open. The disabled-trigger check runs once, at mount.
  import { onBeforeUnmount, onDeactivated, onMounted, ref, useId, type VNode } from 'vue'
  import { panelAnchorStyle, triggerAnchorStyle } from '../internal/anchor'
  import { warn } from '../internal/dev'
  import type { PopoverAlign, PopoverSide, TooltipTriggerBind } from '../types'

  defineOptions({ inheritAttrs: false })
  const props = withDefaults(
    defineProps<{
      text: string
      side?: PopoverSide
      align?: PopoverAlign
      delay?: number
    }>(),
    { side: 'top', align: 'center', delay: 400 }
  )
  defineSlots<{
    trigger?: (props: { bind: TooltipTriggerBind }) => VNode[]
  }>()

  // ms the pointer may spend between the trigger and the tooltip before it hides.
  const GRACE = 100

  const uid = useId()
  const tipId = `${uid}-tooltip`
  const tip = ref<HTMLElement>()

  let open = false
  // Shown by keyboard focus: pointer leave does not hide it while the trigger keeps focus.
  let focused = false
  let showTimer: ReturnType<typeof setTimeout> | undefined
  let hideTimer: ReturnType<typeof setTimeout> | undefined

  function clearTimers(): void {
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
    showTimer = hideTimer = undefined
  }

  // preventDefault keeps this Esc from also reaching the browser's close request, which would
  // close an enclosing <dialog> or auto popover along with the tooltip; the next Esc does that.
  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    hide()
  }

  function show(): void {
    clearTimers()
    const el = tip.value
    if (open || !el) return
    try {
      el.showPopover()
    } catch {
      // Disconnected, or no popover support: nothing to show.
      return
    }
    open = true
    el.ownerDocument.addEventListener('keydown', onKeydown)
  }

  function hide(): void {
    clearTimers()
    focused = false
    if (!open) return
    open = false
    const el = tip.value
    el?.ownerDocument.removeEventListener('keydown', onKeydown)
    try {
      el?.hidePopover()
    } catch {
      // Already hidden or disconnected.
    }
  }

  function onEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') return
    clearTimeout(hideTimer)
    hideTimer = undefined
    if (open || showTimer !== undefined) return
    showTimer = setTimeout(show, props.delay)
  }

  function onTipEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') return
    clearTimeout(hideTimer)
    hideTimer = undefined
  }

  function onLeave(event: PointerEvent): void {
    if (event.pointerType === 'touch') return
    clearTimeout(showTimer)
    showTimer = undefined
    if (!open || focused) return
    clearTimeout(hideTimer)
    hideTimer = setTimeout(hide, GRACE)
  }

  function focusVisible(el: Element): boolean {
    try {
      return el.matches(':focus-visible')
    } catch {
      // No :focus-visible support: any focus counts.
      return true
    }
  }

  function onFocus(event: FocusEvent): void {
    const target = event.currentTarget as Element | null
    if (!target || !focusVisible(target)) return
    show()
    focused = open
  }

  function onBlur(): void {
    hide()
  }

  const bind = {
    'aria-describedby': tipId,
    style: triggerAnchorStyle(uid),
    onPointerenter: onEnter,
    onPointerleave: onLeave,
    onFocus,
    onBlur
  }

  onMounted(() => {
    if (!props.text?.trim()) warn('BlTooltip: `text` is empty; the tooltip has nothing to say.')
    const trigger = tip.value?.parentNode?.querySelector(`[aria-describedby~="${tipId}"]`)
    if (trigger?.matches(':disabled'))
      warn(
        'BlTooltip: the trigger is disabled; disabled elements fire no pointer or focus events, ' +
          'so the tooltip never shows.'
      )
  })
  // KeepAlive: a deactivated tooltip would otherwise stay open with its Esc listener attached.
  onDeactivated(hide)
  onBeforeUnmount(() => {
    clearTimers()
    tip.value?.ownerDocument.removeEventListener('keydown', onKeydown)
    open = false
  })
</script>
