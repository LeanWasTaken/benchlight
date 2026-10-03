<template>
  <span class="bl-eq" :class="{ 'bl-eq--active': active }" aria-hidden="true">
    <span v-for="bar in 4" :key="bar" class="bl-eq__bar" />
  </span>
</template>

<script setup lang="ts">
  defineProps<{ active?: boolean }>()
</script>
