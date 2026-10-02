<template>
  <span
    class="kd-led"
    :class="{ 'kd-led--on': state === 'on', 'kd-led--danger': state === 'danger' }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ state?: 'on' | 'off' | 'danger' }>(), { state: 'off' })
</script>
