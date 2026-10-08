<template>
  <span
    class="bl-led"
    :class="{ 'bl-led--on': state === 'on', 'bl-led--danger': state === 'danger' }"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  />
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ state?: 'on' | 'off' | 'danger'; label?: string }>(), {
    state: 'off'
  })
</script>
