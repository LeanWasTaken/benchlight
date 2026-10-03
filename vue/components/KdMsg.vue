<template>
  <p class="kd-msg" :class="`kd-msg--${tone}`" :role="tone === 'err' ? 'alert' : 'status'">
    <slot />
  </p>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ tone?: 'ok' | 'err' | 'info' }>(), { tone: 'info' })
</script>
