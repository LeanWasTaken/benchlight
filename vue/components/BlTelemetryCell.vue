<template>
  <div class="bl-telemetry__cell">
    <span class="bl-telemetry__label">{{ label }}</span>
    <span class="bl-telemetry__value"><slot /></span>
  </div>
</template>

<script setup lang="ts">
  defineProps<{ label: string }>()
</script>
