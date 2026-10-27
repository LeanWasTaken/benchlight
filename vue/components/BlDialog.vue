<template>
  <dialog
    ref="el"
    class="bl-dialog"
    :aria-labelledby="titleId"
    :aria-describedby="description ? descId : undefined"
    v-bind="{ closedby: dismissible ? undefined : 'none' }"
    @cancel="onCancel"
    @close="onClose"
    @pointerdown="onPointerDown"
    @click="onClick"
  >
    <div class="bl-dialog__panel">
      <div class="bl-dialog__head">
        <h2 :id="titleId" class="bl-dialog__title">{{ title }}</h2>
        <BlButton
          v-if="dismissible"
          class="bl-dialog__close"
          variant="ghost"
          :label="text.close"
          @click="closeWith('button')"
        >
          <template #icon>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </template>
        </BlButton>
      </div>
      <p v-if="description" :id="descId" class="bl-dialog__description">{{ description }}</p>
      <div class="bl-dialog__body"><slot /></div>
      <Foot :nodes="$slots['footer']?.()" />
    </div>
    <!-- Outside the panel: the panel's entry transform would capture the fixed toaster. -->
    <div ref="toasts" class="bl-dialog__toasts" />
  </dialog>
</template>

<script setup lang="ts">
  import { computed, h, onBeforeUnmount, onMounted, ref, useId, watch, type VNode } from 'vue'
  import { warn } from '../internal/dev'
  import { lockPage, unlockPage } from '../internal/pageLock'
  import { hasContent } from '../internal/slots'
  import { pushToastHost, removeToastHost, toastFocus } from '../internal/toastHosts'
  import { mergeLabels } from '../internal/labels'
  import type { DialogCloseEvent, DialogCloseReason, DialogLabels, LabelOverrides } from '../types'
  import BlButton from './BlButton.vue'

  const props = withDefaults(
    defineProps<{
      title: string
      description?: string
      dismissible?: boolean
      labels?: Partial<LabelOverrides<DialogLabels>>
    }>(),
    { dismissible: true }
  )
  defineSlots<{ default?: () => VNode[]; footer?: () => VNode[] }>()
  const open = defineModel<boolean>('open', { required: true })
  const emit = defineEmits<{
    close: [payload: DialogCloseEvent]
  }>()
  const el = ref<HTMLDialogElement>()
  const toasts = ref<HTMLElement>()
  // The footer slot is evaluated once per render; an empty or v-if-ed footer is dropped, and
  // the result is remembered for the "no way out" warning (slots are not called outside render).
  let hasFooter = false
  const Foot = (p: { nodes?: VNode[] | undefined }) => {
    hasFooter = hasContent(p.nodes)
    return hasFooter ? h('div', { class: 'bl-dialog__foot' }, p.nodes) : null
  }
  const titleId = useId()
  const descId = useId()
  const text = computed<DialogLabels>(() => mergeLabels({ close: 'Close' }, props.labels))

  let isOpen = false
  let pendingReason: DialogCloseReason | null = null
  let opener: HTMLElement | null = null
  let fallback: HTMLElement | null = null
  let downOnBackdrop = false

  function show(): void {
    const dialog = el.value
    if (!dialog) return
    if (isOpen) {
      if (dialog.open) return
      // Closed earlier in this task, its close event still queued: finish that session now
      // (onClose ignores the late event once the dialog is open again), then reopen.
      finish(false)
    }
    if (!props.dismissible && !hasFooter)
      warn('BlDialog: dismissible is false and the footer is empty, so nothing can close it.')
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // Opened from a toast action: that toast is dismissed right after, taking the opener with it.
    fallback = opener?.closest('.bl-toaster') ? toastFocus.returnTarget : null
    lockPage()
    // close() without an argument keeps the previous returnValue; never report a stale one.
    dialog.returnValue = ''
    dialog.showModal()
    isOpen = true
    if (toasts.value) pushToastHost(toasts.value)
  }

  function closeWith(reason: DialogCloseReason): void {
    if (!isOpen) return
    pendingReason = reason
    // Release the toast host now, not in the async close event: a toast fired in the same tick
    // (Save closes the dialog and toasts "Saved") must be spoken where the toaster lands next.
    if (toasts.value) removeToastHost(toasts.value)
    el.value?.close()
  }

  // Esc. Dismissible: let it close and remember why. Not dismissible: block it; if the browser
  // refuses (Chromium's anti-abuse makes cancel non-cancelable), the close proceeds as 'escape'.
  function onCancel(event: Event): void {
    if (props.dismissible) {
      pendingReason = 'escape'
      return
    }
    event.preventDefault()
    pendingReason = event.cancelable ? null : 'escape'
  }

  // The only emitter. Fires for every way a dialog closes; happy-dom dispatches it synchronously.
  // An open dialog here means show() already finished this session and reopened.
  function onClose(): void {
    if (isOpen && !el.value?.open) finish(true)
  }

  // Settles a session exactly once. A reopen (sync false) keeps v-model as the parent set it.
  function finish(sync: boolean): void {
    isOpen = false
    const reason = pendingReason ?? 'native'
    pendingReason = null
    if (toasts.value) removeToastHost(toasts.value)
    unlockPage()
    if (sync && open.value) open.value = false
    emit('close', { reason, returnValue: el.value?.returnValue ?? '' })
    restoreFocus()
  }

  // Native <dialog> already restores focus; only step in when focus was lost, so a @close
  // handler that moves focus on purpose keeps its choice.
  function restoreFocus(): void {
    const active = document.activeElement
    const lost = !active || active === document.body || gone(active) || el.value?.contains(active)
    if (lost) returnTarget()?.focus({ preventScroll: true })
    opener = fallback = null
  }
  function returnTarget(): HTMLElement | null {
    if (opener && !gone(opener)) return opener
    return fallback && !gone(fallback) ? fallback : null
  }
  // Removed, or inside a toast that is animating out (still connected until its leave ends).
  function gone(node: Element): boolean {
    return !node.isConnected || node.closest('.bl-toast-leave-active') !== null
  }

  function onPointerDown(event: Event): void {
    downOnBackdrop = event.target === el.value
  }
  function onClick(event: MouseEvent): void {
    const backdrop = downOnBackdrop && event.target === el.value
    downOnBackdrop = false
    if (backdrop && props.dismissible) closeWith('backdrop')
  }

  watch(open, (value) => {
    if (value) show()
    else closeWith('program')
  })
  onMounted(() => {
    if (open.value) show()
  })
  onBeforeUnmount(() => {
    if (!isOpen) return
    isOpen = false
    if (toasts.value) removeToastHost(toasts.value)
    unlockPage()
    el.value?.close()
    returnTarget()?.focus({ preventScroll: true })
    opener = fallback = null
  })
</script>
