<template>
  <div class="bl-range">
    <input
      :id="id"
      v-model.number="model"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :aria-valuetext="text"
    />
    <span class="bl-range__value" aria-hidden="true">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      id?: string
      min?: number
      max?: number
      step?: number
      format?: (value: number) => string
    }>(),
    { min: 0, max: 100, step: 1 }
  )
  const model = defineModel<number>({ default: 0 })
  const text = computed(() => (props.format ? props.format(model.value) : String(model.value)))
</script>
