<template>
  <div
    class="bl-meter"
    role="progressbar"
    :aria-label="label"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="indeterminate ? undefined : Math.round(fraction * 100)"
    :data-indeterminate="indeterminate ? '' : undefined"
  >
    <div
      class="bl-meter__fill"
      :style="indeterminate ? undefined : { '--bl-meter-value': fraction }"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{ value: number | null; label: string }>()
  const indeterminate = computed(() => props.value === null)
  const fraction = computed(() => {
    const value = props.value ?? 0
    return Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value))
  })
</script>
