<template>
  <nav class="bl-tab-bar" :aria-label="ariaLabel">
    <slot />
  </nav>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ ariaLabel?: string }>(), { ariaLabel: 'Primary' })
</script>
