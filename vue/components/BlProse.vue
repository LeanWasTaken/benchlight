<template>
  <component :is="as" class="bl-prose"><slot /></component>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ as?: string }>(), { as: 'div' })
</script>
