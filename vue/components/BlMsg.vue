<template>
  <p class="bl-msg" :class="`bl-msg--${tone}`" :role="tone === 'err' ? 'alert' : 'status'">
    <span class="bl-msg__text"><slot /></span>
  </p>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ tone?: 'ok' | 'err' | 'info' }>(), { tone: 'info' })
</script>
