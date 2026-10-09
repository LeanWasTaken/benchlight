<template>
  <Teleport :to="host ?? 'body'" :disabled="!host">
    <section
      ref="root"
      class="bl-toaster"
      :aria-label="text.region"
      v-bind="$attrs"
      @pointerenter="onPointer($event, true)"
      @pointerleave="onPointer($event, false)"
      @focusin="onFocusIn"
      @focusout="onFocusOut"
    >
      <TransitionGroup
        v-if="mounted"
        tag="ol"
        name="bl-toast"
        class="bl-toaster__list"
        @before-leave="pin"
      >
        <li
          v-for="t in visible"
          :key="t.id"
          :ref="(e: unknown) => setItem(t.id, e as HTMLElement | null)"
          class="bl-toast"
          :class="t.tone === 'neutral' ? undefined : `bl-toast--${t.tone}`"
        >
          <span v-if="t.tone !== 'neutral'" class="bl-toast__mark" aria-hidden="true" />
          <p :id="`${uid}-${t.key}`" class="bl-toast__message">{{ t.message }}</p>
          <BlButton v-if="t.action" class="bl-toast__action" variant="ghost" @click="runAction(t)">
            {{ t.action.label }}
          </BlButton>
          <BlButton
            class="bl-toast__dismiss"
            variant="ghost"
            :label="text.dismiss"
            :aria-describedby="`${uid}-${t.key}`"
            @click="dismissToast(t.id)"
          >
            <template #icon>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </template>
          </BlButton>
        </li>
      </TransitionGroup>
      <ol v-else class="bl-toaster__list" />
      <!-- Not atomic (role status/alert default to atomic): speak only the appended line. -->
      <div ref="status" class="bl-sr-only" role="status" aria-atomic="false" />
      <div ref="alert" class="bl-sr-only" role="alert" aria-atomic="false" />
    </section>
  </Teleport>
</template>

<script setup lang="ts">
  import {
    computed,
    effectScope,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    watch
  } from 'vue'
  import { warn } from '../internal/dev'
  import { toastFocus, toastHosts } from '../internal/toastHosts'
  import { dismissToast, toastState, type ToastRecord } from '../internal/toastStore'
  import { mergeLabels } from '../internal/labels'
  import type { ToasterLabels } from '../types'
  import BlButton from './BlButton.vue'

  defineOptions({ inheritAttrs: false })
  const props = withDefaults(defineProps<{ max?: number; labels?: Partial<ToasterLabels> }>(), {
    max: 3
  })
  const text = computed<ToasterLabels>(() =>
    mergeLabels(
      {
        region: 'Notifications',
        dismiss: 'Dismiss',
        actionHint: (label: string) => `${label} available`
      },
      props.labels
    )
  )
  const uid = useId()
  const root = ref<HTMLElement>()
  const status = ref<HTMLElement>()
  const alert = ref<HTMLElement>()
  // The list renders only after mount, so a toast() before hydration cannot cause a mismatch.
  const mounted = ref(false)
  // While a modal dialog is open everything outside it is inert: render inside the topmost one.
  const host = computed(() => toastHosts.value.at(-1) ?? null)
  const visible = computed(() => toastState.items.slice(0, props.max))

  const elements = new Map<string, HTMLElement>()
  function setItem(id: string, el: HTMLElement | null): void {
    if (el) elements.set(id, el)
    else elements.delete(id)
  }

  // ---- speech: append to a persistent region so repeats and same-tick toasts all speak
  function announce(t: ToastRecord): void {
    const words = t.action ? `${t.message}, ${text.value.actionHint(t.action.label)}` : t.message
    nextTick(() => speak(t.tone === 'danger', words))
  }
  // Deferred watchers are created in a nextTick, outside setup: own them here so unmount stops them.
  const scope = effectScope()
  function speak(danger: boolean, words: string): void {
    const region = danger ? alert.value : status.value
    if (!region) return
    // A region inside a closing dialog is leaving the accessibility tree, and text moved along
    // with it is not announced: wait until the toaster has moved to its next host.
    const dialog = region.closest('dialog')
    if (dialog && !dialog.open) {
      scope.run(() => {
        const stop = watch(
          host,
          () => {
            stop()
            speak(danger, words)
          },
          { flush: 'post' }
        )
      })
      return
    }
    const p = document.createElement('p')
    p.textContent = words
    region.append(p)
    setTimeout(() => p.remove(), 7000)
  }
  watch(
    () => toastState.cleared,
    () => {
      status.value?.replaceChildren()
      alert.value?.replaceChildren()
    }
  )

  // ---- timers: owned here, started when a toast becomes visible
  interface Timer {
    remaining: number
    start: number
    handle?: ReturnType<typeof setTimeout>
  }
  const timers = new Map<string, Timer>()
  let hovered = false
  let focused = false
  const paused = () => hovered || focused || document.visibilityState === 'hidden'
  function run(id: string): void {
    const timer = timers.get(id)
    if (!timer) return
    timer.start = Date.now()
    timer.handle = setTimeout(() => dismissToast(id), timer.remaining)
  }
  function arm(t: ToastRecord): void {
    stop(t.id)
    if (t.duration <= 0) return
    timers.set(t.id, { remaining: t.duration, start: 0 })
    if (!paused()) run(t.id)
  }
  function stop(id: string): void {
    const timer = timers.get(id)
    if (timer?.handle !== undefined) clearTimeout(timer.handle)
    timers.delete(id)
  }
  function pauseAll(): void {
    for (const timer of timers.values()) {
      if (timer.handle === undefined) continue
      clearTimeout(timer.handle)
      timer.handle = undefined
      timer.remaining -= Date.now() - timer.start
    }
  }
  function resumeAll(): void {
    if (paused()) return
    for (const [id, timer] of timers) if (timer.handle === undefined) run(id)
  }
  function onPointer(event: PointerEvent, over: boolean): void {
    if (event.pointerType !== 'mouse') return
    hovered = over
    if (over) pauseAll()
    else resumeAll()
  }
  function onVisibility(): void {
    if (paused()) pauseAll()
    else resumeAll()
  }

  // ---- focus: never taken; moved only when a focused toast disappears
  function onFocusIn(event: FocusEvent): void {
    const from = event.relatedTarget
    if (from instanceof HTMLElement && !root.value?.contains(from)) toastFocus.returnTarget = from
    if (!focused) {
      focused = true
      pauseAll()
    }
  }
  function onFocusOut(event: FocusEvent): void {
    const to = event.relatedTarget
    if (to instanceof Node && root.value?.contains(to)) return
    focused = false
    resumeAll()
  }

  // Before the DOM updates: if focus sits in a toast that is leaving, pick where it goes next.
  watch(
    visible,
    (next, prev) => {
      const active = document.activeElement
      if (!active || !prev) return
      const keep = new Set(next.map((t) => t.id))
      const gone = prev.findIndex((t) => !keep.has(t.id) && elements.get(t.id)?.contains(active))
      if (gone < 0) return
      const after = prev.slice(gone + 1).find((t) => keep.has(t.id)) ?? next.at(-1)
      nextTick(() => {
        const back = toastFocus.returnTarget
        const button = after
          ? elements.get(after.id)?.querySelector<HTMLElement>('.bl-toast__dismiss')
          : null
        if (button) button.focus({ preventScroll: true })
        else if (back?.isConnected && !back.closest('[inert]')) back.focus({ preventScroll: true })
        else (active as HTMLElement).blur?.()
        // Removing a focused node need not fire focusout (Firefox, Safari, happy-dom).
        focused = Boolean(root.value?.contains(document.activeElement))
        if (!focused) resumeAll()
      })
    },
    { flush: 'pre' }
  )

  // A leaving toast leaves the flow (CSS) so the others move at once; keep it where it was.
  function pin(el: Element): void {
    const item = el as HTMLElement
    item.style.insetBlockStart = `${item.offsetTop}px`
  }

  function runAction(t: ToastRecord): void {
    try {
      t.action?.onClick()
    } finally {
      dismissToast(t.id)
    }
  }

  // After the DOM updates: start timers and speak for newly visible or replaced toasts.
  const seen = new Map<string, { version: number; message: string }>()
  function sync(list: ToastRecord[]): void {
    const ids = new Set(list.map((t) => t.id))
    for (const id of [...timers.keys()]) if (!ids.has(id)) stop(id)
    for (const id of [...seen.keys()]) if (!ids.has(id)) seen.delete(id)
    for (const t of list) {
      const prev = seen.get(t.id)
      if (prev && prev.version === t.version) continue
      if (!prev || prev.message !== t.message) announce(t)
      seen.set(t.id, { version: t.version, message: t.message })
      arm(t)
    }
  }

  // ---- layering: a dialog that closes with an exit transition (Chromium's `overlay`) stays in
  // the top layer, backdrop and all, until it ends. The toaster has already left it (so it is
  // announced outside), so it rides in the top layer too, as a manual popover shown after the
  // dialog closed and so stacked above it, until the dialog's own transitions settle.
  let layer = 0
  function raise(dialog: HTMLDialogElement): void {
    const el = root.value
    if (!el || typeof el.showPopover !== 'function') return
    // Reduced motion leaves base.css's 0.01ms transitions: not worth a trip to the top layer.
    const exits =
      dialog
        .getAnimations?.()
        .filter(
          (a) =>
            'transitionProperty' in a && Number(a.effect?.getComputedTiming().duration ?? 0) > 1
        ) ?? []
    if (exits.length === 0) return // closed at once: no overlay support, or reduced motion
    const token = ++layer
    try {
      el.popover = 'manual'
      el.showPopover()
    } catch {
      el.removeAttribute('popover')
      return
    }
    void Promise.allSettled(exits.map((a) => a.finished)).then(() => {
      if (token === layer) lower()
    })
  }
  function lower(): void {
    layer++
    const el = root.value
    if (!el?.hasAttribute('popover')) return
    if (el.matches(':popover-open')) el.hidePopover()
    el.removeAttribute('popover')
  }
  // After the move: a teleport hides a showing popover (removal), so always lower first.
  watch(
    host,
    (_, prev) => {
      lower()
      const dialog = prev?.closest('dialog')
      if (dialog && !dialog.open) raise(dialog)
    },
    { flush: 'post' }
  )

  onMounted(() => {
    if (++toastState.toasters > 1) warn('BlToaster: mount one toaster per page.')
    mounted.value = true
    document.addEventListener('visibilitychange', onVisibility)
    watch(visible, sync, { immediate: true, flush: 'post' })
  })
  onBeforeUnmount(() => {
    lower()
    toastState.toasters--
    toastFocus.returnTarget = null
    scope.stop()
    document.removeEventListener('visibilitychange', onVisibility)
    for (const id of [...timers.keys()]) stop(id)
  })
</script>
