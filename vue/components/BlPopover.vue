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
  // dismiss (Esc, outside click) close the native popover. Closes started here (the model, the
  // trigger) play the exit first (playExit); the browser's light dismiss cannot be held.
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
  import { playExit } from '../internal/exit'
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

  // True while a KeepAlive has the component deactivated: the panel is hidden, `open` is untouched.
  const suspended = ref(false)

  const bind = computed(() => ({
    id: `${uid}-trigger`,
    // A <button> in a <form> defaults to submit: the click would submit instead of opening.
    type: 'button' as const,
    'aria-expanded': open.value && !suspended.value ? ('true' as const) : ('false' as const),
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
  // Cancels the exit under way: the panel is still showing until it ends.
  let exit: (() => void) | null = null
  function stopExit(): void {
    exit?.()
    exit = null
  }

  // `toggle` fires asynchronously; `beforetoggle` reports the new state at once. A light dismiss
  // during the exit ends it.
  function onBeforeToggle(event: Event): void {
    stopExit()
    const next = (event as ToggleEvent).newState === 'open'
    shown = next
    if (suspended.value) return
    if (open.value !== next) open.value = next
  }

  function sync(): void {
    const el = panel.value
    if (!el || clicking || suspended.value || typeof el.showPopover !== 'function') return
    const want = open.value
    if (want) stopExit()
    if (want === shown || exit) return
    if (!want) {
      // Its content can be interactive: inert for the exit, with focus inside handed to the
      // trigger now, where hidePopover() would have returned it.
      const trigger = el.parentNode?.querySelector<HTMLElement>(`[aria-controls="${panelId}"]`)
      const done = () => {
        exit = null
        hidePanel(el)
      }
      // No wired trigger: leave focus to hidePopover().
      const cancel = playExit(el, done, { inert: [el], focus: trigger ?? null })
      exit = el.hasAttribute('data-closing') ? cancel : null
      return
    }
    try {
      el.showPopover()
      shown = true
    } catch {
      // Disconnected panel, or a state change already under way: beforetoggle settles it.
    }
  }
  function hidePanel(el: HTMLElement): void {
    try {
      el.hidePopover()
      shown = false
    } catch {
      // Disconnected panel, or a state change already under way: beforetoggle settles it.
    }
  }
  watch(open, sync, { flush: 'post' })

  // After every handler on the trigger and its ancestors, still before the browser's toggle.
  // A click whose propagation was stopped never gets here and toggles natively.
  let deciding: ((event: Event) => void) | null = null
  function onClickBubble(event: Event): void {
    deciding?.(event)
  }
  function onClickCapture(event: Event): void {
    const target = event.target as Element | null
    const trigger = target?.closest?.('[popovertarget]')
    if (trigger?.getAttribute('popovertarget') !== panelId) return
    clicking = true
    // The browser's toggle would hide a showing panel at once: close it here instead, through
    // the model, so the exit plays; a click during the exit keeps it open. Decided once the
    // click has bubbled (onClickBubble), so a consumer's preventDefault() still keeps it as is.
    const toggle = shown && !suspended.value && panel.value?.isConnected === true
    const reopen = exit !== null
    let take = false
    deciding = toggle
      ? (e) => {
          if (e !== event) return
          deciding = null
          if (e.defaultPrevented) return
          e.preventDefault()
          take = true
        }
      : null
    setTimeout(() => {
      clicking = false
      deciding = null
      if (take && !suspended.value) open.value = reopen
      sync()
    })
  }

  onMounted(() => {
    const el = panel.value!
    el.ownerDocument.addEventListener('click', onClickCapture, true)
    el.ownerDocument.addEventListener('click', onClickBubble)
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
  // KeepAlive: hide a deactivated popover so `shown` and aria-expanded agree with the page, but
  // leave the `open` model alone (the user did not choose this) and reopen if it is still true.
  // A detached panel cannot play an exit, so this hides at once.
  onDeactivated(() => {
    clicking = false
    suspended.value = true
    stopExit()
    if (!shown) return
    shown = false
    try {
      panel.value?.hidePopover()
    } catch {
      // Already hidden.
    }
  })
  onActivated(() => {
    suspended.value = false
    sync()
  })
  onBeforeUnmount(() => {
    stopExit()
    panel.value?.ownerDocument.removeEventListener('click', onClickCapture, true)
    panel.value?.ownerDocument.removeEventListener('click', onClickBubble)
  })
</script>
