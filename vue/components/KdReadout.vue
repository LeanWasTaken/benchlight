<template>
  <p class="kd-readout">
    <span class="kd-readout__value">{{ value }}</span>
    <span v-if="unit" class="kd-readout__unit">{{ unit }}</span>
  </p>
</template>

<script setup lang="ts">
  defineProps<{ value: string | number; unit?: string }>()
</script>
