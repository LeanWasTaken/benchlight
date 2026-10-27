<template>
  <span
    class="bl-led"
    :class="{ 'bl-led--on': state === 'on', 'bl-led--danger': state === 'danger' }"
    :role="ariaLabel ? 'img' : undefined"
    :aria-label="ariaLabel || undefined"
    :aria-hidden="ariaLabel ? undefined : 'true'"
  />
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ state?: 'on' | 'off' | 'danger'; ariaLabel?: string }>(), {
    state: 'off'
  })
</script>
