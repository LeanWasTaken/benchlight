<template>
  <ul class="kd-index" :class="{ 'kd-index--ruled-top': ruledTop, 'kd-index--grid': grid }">
    <slot />
  </ul>
</template>

<script setup lang="ts">
  defineProps<{ ruledTop?: boolean; grid?: boolean }>()
</script>
