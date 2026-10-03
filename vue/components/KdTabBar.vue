<template>
  <nav class="kd-tabbar" :aria-label="label">
    <slot />
  </nav>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ label?: string }>(), { label: 'Primary' })
</script>
