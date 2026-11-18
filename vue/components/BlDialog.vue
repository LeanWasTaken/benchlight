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
          :aria-label="text.close"
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
  import { computed, h, ref, useId, type VNode } from 'vue'
  import { warn } from '../internal/dev'
  import { hasContent } from '../internal/slots'
  import { mergeLabels } from '../internal/labels'
  import { useModal } from '../internal/useModal'
  import type { DialogCloseEvent, DialogLabels, LabelOverrides } from '../types'
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

  const { closeWith, onCancel, onClose, onPointerDown, onClick } = useModal({
    el,
    toasts,
    open,
    dismissible: () => props.dismissible,
    beforeShow: () => {
      if (!props.dismissible && !hasFooter)
        warn('BlDialog: dismissible is false and the footer is empty, so nothing can close it.')
    },
    emitClose: (payload) => emit('close', payload)
  })
</script>
