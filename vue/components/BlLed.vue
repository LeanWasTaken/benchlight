<template>
  <span
    class="bl-led"
    :class="{ 'bl-led--on': state === 'on', 'bl-led--danger': state === 'danger' }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ state?: 'on' | 'off' | 'danger' }>(), { state: 'off' })
</script>
