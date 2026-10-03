<template>
  <div class="kd-telemetry" :style="columns ? { '--kd-telemetry-columns': columns } : undefined">
    <div class="kd-ruler" aria-hidden="true" />
    <div class="kd-telemetry__cells">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{ columns?: string }>()
</script>
