<template>
  <div class="bl-range" :class="attrs.class" :style="attrs.style as StyleValue">
    <input
      v-model.number="model"
      class="bl-range__input"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :aria-valuetext="text"
      v-bind="inputAttrs()"
    />
    <span class="bl-range__value" aria-hidden="true">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
  import { computed, inject, useAttrs, type StyleValue } from 'vue'
  import { FIELD_CONTEXT } from '../types'
  import { mergeDescribedBy } from '../internal/describedBy'

  // CSS: the track keeps at least 96px; set `--bl-range-value-width` to reserve room for the longest
  // value (default 56px) so the track does not change length while dragging.
  const props = withDefaults(
    defineProps<{
      min?: number
      max?: number
      step?: number
      format?: (value: number) => string
    }>(),
    { min: 0, max: 100, step: 1 }
  )
  // Everything but class/style belongs to the slider (aria-label, disabled, name, listeners);
  // class/style stay on the wrapper that carries the layout.
  defineOptions({ inheritAttrs: false })
  const attrs = useAttrs()
  // A function, not a computed: the attrs proxy is not reactive to keys added after setup.
  // The field context supplies `id` and the hint id; consumer attrs bind after it, so an `id`
  // wins and an `aria-describedby` is merged after the hint id.
  function inputAttrs(): Record<string, unknown> {
    const rest = Object.fromEntries(
      Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')
    )
    return {
      id: field?.id.value,
      'aria-invalid': field?.invalid?.value === true ? 'true' : undefined,
      ...rest,
      'aria-describedby': mergeDescribedBy(field?.describedBy.value, attrs['aria-describedby'])
    }
  }
  const model = defineModel<number>({ default: 0 })
  const field = inject(FIELD_CONTEXT, null)
  const text = computed(() => (props.format ? props.format(model.value) : String(model.value)))
</script>
