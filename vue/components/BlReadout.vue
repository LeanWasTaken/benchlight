<template>
  <p class="bl-readout">
    <span class="bl-readout__value">{{ value }}</span>
    <span v-if="unit" class="bl-readout__unit">{{ unit }}</span>
  </p>
</template>

<script setup lang="ts">
  defineProps<{ value: string | number; unit?: string }>()
</script>
