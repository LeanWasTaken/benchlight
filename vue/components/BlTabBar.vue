<template>
  <nav class="bl-tab-bar" :aria-label="label">
    <slot />
  </nav>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ label?: string }>(), { label: 'Primary' })
</script>
