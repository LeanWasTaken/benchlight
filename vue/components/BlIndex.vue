<template>
  <ul class="bl-index" :class="{ 'bl-index--ruled-top': ruledTop, 'bl-index--grid': grid }">
    <slot />
  </ul>
</template>

<script setup lang="ts">
  defineProps<{ ruledTop?: boolean; grid?: boolean }>()
</script>
