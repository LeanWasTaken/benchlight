<template>
  <div class="bl-range" :class="attrs.class" :style="attrs.style as StyleValue">
    <input
      ref="el"
      :value="current"
      class="bl-range__input"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :aria-valuetext="text"
      :disabled="disabled"
      v-bind="inputAttrs()"
      @input="model = Number(($event.target as HTMLInputElement).value)"
    />
    <span class="bl-range__value" aria-hidden="true">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
  import { computed, inject, onMounted, ref, useAttrs, type StyleValue } from 'vue'
  import { FIELD_CONTEXT } from '../types'
  import { mergeDescribedBy } from '../internal/describedBy'
  import { controlId } from '../internal/fieldId'
  import { useFormReset } from '../internal/useFormReset'

  // CSS: the track keeps at least 96px; set `--bl-range-value-width` to reserve room for the longest
  // value (default 56px) so the track does not change length while dragging.
  const props = withDefaults(
    defineProps<{
      min?: number
      max?: number
      step?: number
      format?: (value: number) => string
      disabled?: boolean
    }>(),
    { min: 0, max: 100, step: 1 }
  )
  // Everything but class/style belongs to the slider (aria-label, name, listeners);
  // class/style stay on the wrapper that carries the layout.
  defineOptions({ inheritAttrs: false })
  const attrs = useAttrs()
  // A function, not a computed: the attrs proxy is not reactive to keys added after setup.
  // The field context supplies `id` and the hint id; consumer attrs bind after it, so the field's `id`
  // and an `aria-describedby` is merged after the hint id.
  function inputAttrs(): Record<string, unknown> {
    const rest = Object.fromEntries(
      Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')
    )
    return {
      'aria-invalid': field?.invalid?.value === true ? 'true' : undefined,
      ...rest,
      id: controlId('BlRange', field, attrs['id']),
      'aria-describedby': mergeDescribedBy(field?.describedBy.value, attrs['aria-describedby'])
    }
  }
  const model = defineModel<number>()
  const el = ref<HTMLInputElement>()
  const field = inject(FIELD_CONTEXT, null)
  // Display only: an unset or out-of-range model is shown clamped and snapped, never written back.
  const current = computed(() => {
    const { min, max, step } = props
    const raw = Math.min(max, Math.max(min, model.value ?? min))
    const round = (n: number) => Number(n.toFixed(10))
    const snapped = round(step > 0 ? min + Math.round((raw - min) / step) * step : raw)
    // Past an off-step max the native thumb sits on the last step below it, not on max.
    return snapped > max ? round(snapped - step) : snapped
  })
  // A native form reset moves the thumb without an input event. The mount-time model (or, with
  // none, the value shown then) is the default, written just before the reset: a range input
  // otherwise resets to the midpoint of min and max. The model is then synced to the element.
  let initial = 0
  onMounted(() => (initial = model.value ?? current.value))
  useFormReset(
    el,
    () => {
      if (!el.value) return
      const value = Number(el.value.value)
      if (value !== model.value) model.value = value
    },
    () => {
      if (el.value) el.value.defaultValue = String(initial)
    }
  )
  const text = computed(() => (props.format ? props.format(current.value) : String(current.value)))
</script>
