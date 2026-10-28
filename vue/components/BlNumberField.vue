<template>
  <input
    ref="input"
    v-server-value="model"
    class="bl-input"
    type="number"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    v-bind="inputAttrs()"
    @input="onInput"
    @change="onChange"
    @blur="onBlur"
    @wheel.passive="onWheel"
  />
</template>

<script setup lang="ts">
  import { inject, onMounted, ref, useAttrs, watch, type ObjectDirective } from 'vue'
  import { FIELD_CONTEXT } from '../types'
  import { mergeDescribedBy } from '../internal/describedBy'

  const props = defineProps<{
    min?: number
    max?: number
    step?: number
    disabled?: boolean
  }>()
  defineOptions({ inheritAttrs: false })
  // `null` is an empty field. The value is never bound with `v-model`/`:value`: Vue would rewrite
  // the element on every render, wiping intermediate text such as "-" or "1e" while it is typed.
  const model = defineModel<number | null>({ default: null })
  const field = inject(FIELD_CONTEXT, null)
  const attrs = useAttrs()
  const input = ref<HTMLInputElement>()

  // The field context supplies `id` and the hint id; a consumer `id` wins, and a consumer
  // `aria-describedby` is merged after the hint id. Evaluated in render, so attr changes re-run it.
  function inputAttrs(): Record<string, unknown> {
    return {
      id: field?.id.value,
      'aria-invalid': field?.invalid?.value === true ? 'true' : undefined,
      ...attrs,
      'aria-describedby': mergeDescribedBy(field?.describedBy.value, attrs['aria-describedby'])
    }
  }

  const show = (value: number | null | undefined) =>
    typeof value === 'number' && Number.isFinite(value) ? String(value) : ''

  // Server render only: the client writes the element itself (onMounted and the watcher below).
  const vServerValue: ObjectDirective<HTMLInputElement, number | null> = {
    getSSRProps: ({ value }) => ({ value: show(value) })
  }

  function write(value: number | null) {
    if (input.value) input.value.value = show(value)
  }

  // What the user's own typing last put in the model. While the field has focus, a model change
  // that only echoes it leaves the element alone, so the text being typed survives.
  let typed: { value: number | null } | undefined

  function onInput() {
    const n = input.value!.valueAsNumber
    const value = Number.isNaN(n) ? null : n
    typed = { value }
    model.value = value
  }

  // Commit (blur or Enter): clamp to [min, max] and show the result. Not snapped to `step`; native
  // validity still reports a step mismatch. An impossible range (min > max) is left unclamped.
  function clamp(n: number): number {
    const { min, max } = props
    if (min !== undefined && max !== undefined && min > max) return n
    return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
  }

  function onChange() {
    const n = input.value!.valueAsNumber
    const value = Number.isNaN(n) ? null : clamp(n)
    typed = undefined
    model.value = value
    write(value)
  }

  // Leaving the field ends the edit. Unparsable text ("-") does not always fire `change`, so it is
  // cleared here to match the model.
  function onBlur() {
    typed = undefined
    if (input.value?.validity.badInput) write(model.value)
  }

  // The wheel is not blocked (a non-passive listener would also stop the page scrolling); a
  // focused field blurs instead, so the wheel cannot step its value.
  function onWheel(event: WheelEvent) {
    const el = event.currentTarget as HTMLInputElement
    if (document.activeElement === el) el.blur()
  }

  // A value from outside is shown as given (out of range, min > max, NaN included), never clamped
  // or emitted.
  watch(model, (value) => {
    if (typed && Object.is(typed.value, value) && document.activeElement === input.value) return
    // The element no longer shows the typing, so a later model equal to it must be written too.
    typed = undefined
    write(value)
  })

  onMounted(() => write(model.value))
</script>
