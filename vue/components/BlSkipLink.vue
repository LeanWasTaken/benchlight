<template>
  <a class="bl-skip-link" :href="target"><slot>Skip to content</slot></a>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ target?: string }>(), { target: '#main-content' })
</script>
