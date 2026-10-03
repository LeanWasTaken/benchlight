<template>
  <span class="kd-eq" :class="{ 'kd-eq--active': active }" aria-hidden="true">
    <span v-for="bar in 4" :key="bar" class="kd-eq__bar" />
  </span>
</template>

<script setup lang="ts">
  defineProps<{ active?: boolean }>()
</script>
