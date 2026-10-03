<template>
  <component :is="as" class="kd-prose"><slot /></component>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ as?: string }>(), { as: 'div' })
</script>
