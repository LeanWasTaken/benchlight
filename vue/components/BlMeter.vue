<template>
  <div
    class="bl-meter"
    role="progressbar"
    :aria-label="label"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(fraction * 100)"
  >
    <div class="bl-meter__fill" :style="{ '--bl-meter-value': fraction }" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{ value: number; label: string }>()
  const fraction = computed(() =>
    Number.isNaN(props.value) ? 0 : Math.min(1, Math.max(0, props.value))
  )
</script>
