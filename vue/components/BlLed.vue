<template>
  <span
    class="bl-led"
    :class="{ 'bl-led--on': tone === 'success', 'bl-led--danger': tone === 'danger' }"
    :role="ariaLabel ? 'img' : undefined"
    :aria-label="ariaLabel || undefined"
    :aria-hidden="ariaLabel ? undefined : 'true'"
  />
</template>

<script setup lang="ts">
  import type { StatusTone } from '../types'

  withDefaults(defineProps<{ tone?: StatusTone; ariaLabel?: string }>(), {
    tone: 'neutral'
  })
</script>
