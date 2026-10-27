<template>
  <p class="bl-msg" :class="toneClass" :role="tone === 'danger' ? 'alert' : 'status'">
    <span class="bl-msg__text"><slot /></span>
  </p>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  // Inline literal: sfc-props.test.ts requires it. tests/types/status-types.ts keeps it equal
  // to the exported StatusTone.
  const props = withDefaults(defineProps<{ tone?: 'neutral' | 'success' | 'danger' }>(), {
    tone: 'neutral'
  })

  const toneClass = computed(() => (props.tone === 'neutral' ? undefined : `bl-msg--${props.tone}`))
</script>
