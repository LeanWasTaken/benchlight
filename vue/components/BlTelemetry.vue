<template>
  <div class="bl-telemetry" :style="columns ? { '--bl-telemetry-columns': columns } : undefined">
    <div class="bl-ruler" aria-hidden="true" />
    <div class="bl-telemetry__cells">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{ columns?: string }>()
</script>
