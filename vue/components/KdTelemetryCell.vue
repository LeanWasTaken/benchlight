<template>
  <div class="kd-telemetry__cell">
    <span class="kd-telemetry__label">{{ label }}</span>
    <span class="kd-telemetry__value"><slot /></span>
  </div>
</template>

<script setup lang="ts">
  defineProps<{ label: string }>()
</script>
