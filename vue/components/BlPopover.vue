<template>
  <slot name="trigger" :bind="bind" />
  <div
    v-bind="$attrs"
    :id="panelId"
    ref="panel"
    class="bl-popover"
    popover="auto"
    :data-side="side"
    :data-align="align"
    :role="ariaLabel ? 'group' : undefined"
    :aria-label="ariaLabel || undefined"
    :style="panelAnchorStyle(uid)"
    @beforetoggle="onBeforeToggle"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
  // The trigger check behind the dev warnings runs once, at mount: a trigger swapped in later is
  // not re-checked. A controlled-only `open` binding that ignores `update:open` still sees light
  // dismiss (Esc, outside click) close the native popover.
  import {
    computed,
    onActivated,
    onBeforeUnmount,
    onDeactivated,
    onMounted,
    ref,
    useId,
    watch,
    type VNode
  } from 'vue'
  import { panelAnchorStyle, triggerAnchorStyle } from '../internal/anchor'
  import { warn } from '../internal/dev'
  import type { PopoverAlign, PopoverSide, PopoverTriggerBind } from '../types'

  defineOptions({ inheritAttrs: false })
  withDefaults(defineProps<{ side?: PopoverSide; align?: PopoverAlign; ariaLabel?: string }>(), {
    side: 'bottom',
    align: 'center'
  })
  defineSlots<{
    trigger?: (props: { bind: PopoverTriggerBind }) => VNode[]
    default?: () => VNode[]
  }>()
  const open = defineModel<boolean>('open', { default: false })

  const uid = useId()
  const panelId = `${uid}-popover`
  const panel = ref<HTMLElement>()

  const bind = computed(() => ({
    id: `${uid}-trigger`,
    // A <button> in a <form> defaults to submit: the click would submit instead of opening.
    type: 'button' as const,
    'aria-expanded': open.value ? ('true' as const) : ('false' as const),
    'aria-controls': panelId,
    popovertarget: panelId,
    style: triggerAnchorStyle(uid)
  }))

  // What the browser shows, as last reported by beforetoggle (or set by sync below).
  let shown = false
  // True from a click on the trigger until the task ends: the browser's popovertarget toggle runs
  // after every click listener, so a model change made by a consumer's click handler waits for it
  // instead of toggling the panel a second time.
  let clicking = false

  // `toggle` fires asynchronously; `beforetoggle` reports the new state at once.
  function onBeforeToggle(event: Event): void {
    const next = (event as ToggleEvent).newState === 'open'
    shown = next
    if (open.value !== next) open.value = next
  }

  function sync(): void {
    const el = panel.value
    if (!el || clicking || typeof el.showPopover !== 'function') return
    const want = open.value
    if (want === shown) return
    try {
      if (want) el.showPopover()
      else el.hidePopover()
      shown = want
    } catch {
      // Disconnected panel, or a state change already under way: beforetoggle settles it.
    }
  }
  watch(open, sync, { flush: 'post' })

  function onClickCapture(event: Event): void {
    const target = event.target as Element | null
    const trigger = target?.closest?.('[popovertarget]')
    if (trigger?.getAttribute('popovertarget') !== panelId) return
    clicking = true
    setTimeout(() => {
      clicking = false
      sync()
    })
  }

  onMounted(() => {
    const el = panel.value!
    el.ownerDocument.addEventListener('click', onClickCapture, true)
    const trigger = el.parentNode?.querySelector(`[aria-controls="${panelId}"]`)
    if (!trigger) {
      warn('BlPopover: the trigger slot rendered no element with `bind`; spread it on a <button>.')
    } else {
      const isButton =
        trigger instanceof HTMLButtonElement ||
        (trigger instanceof HTMLInputElement && trigger.type === 'button')
      if (!isButton)
        warn(
          `BlPopover: the trigger is a <${trigger.localName}>; popovertarget only works on a <button>.`
        )
    }
    sync()
  })
  // KeepAlive: hide a deactivated popover so `shown` and aria-expanded agree with the page.
  onDeactivated(() => {
    clicking = false
    if (!shown) return
    shown = false
    try {
      panel.value?.hidePopover()
    } catch {
      // Already hidden.
    }
    if (open.value) open.value = false
  })
  onActivated(sync)
  onBeforeUnmount(() => {
    panel.value?.ownerDocument.removeEventListener('click', onClickCapture, true)
  })
</script>
