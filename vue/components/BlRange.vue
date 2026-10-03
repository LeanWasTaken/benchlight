<template>
  <div class="bl-range">
    <input
      :id="id ?? field?.id.value"
      v-model.number="model"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :aria-valuetext="text"
      :aria-describedby="ariaDescribedby ?? field?.describedBy.value"
    />
    <span class="bl-range__value" aria-hidden="true">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
  import { computed, inject } from 'vue'
  import { FIELD_CONTEXT } from '../types'

  const props = withDefaults(
    defineProps<{
      id?: string
      ariaDescribedby?: string
      min?: number
      max?: number
      step?: number
      format?: (value: number) => string
    }>(),
    { min: 0, max: 100, step: 1 }
  )
  const model = defineModel<number>({ default: 0 })
  const field = inject(FIELD_CONTEXT, null)
  const text = computed(() => (props.format ? props.format(model.value) : String(model.value)))
</script>
