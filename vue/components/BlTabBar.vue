<template>
  <nav class="bl-tabbar" :aria-label="label">
    <slot />
  </nav>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ label?: string }>(), { label: 'Primary' })
</script>
