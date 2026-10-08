<template>
  <p class="bl-msg" :class="toneClass" :role="resolved === 'danger' ? 'alert' : 'status'">
    <span class="bl-msg__text"><slot /></span>
  </p>
</template>

<script setup lang="ts">
  import { computed, watchEffect } from 'vue'
  import { warnOnce } from '../internal/dev'

  // Inline literal: sfc-props.test.ts requires it. tests/types/status-types.ts keeps it equal
  // to the exported StatusTone.
  const props = withDefaults(defineProps<{ tone?: 'neutral' | 'success' | 'danger' }>(), {
    tone: 'neutral'
  })

  // Pre-0.7 tone names, accepted with a one-time dev warning until v1.
  const LEGACY = { info: 'neutral', ok: 'success', err: 'danger' } as const

  const resolved = computed(() => LEGACY[props.tone as keyof typeof LEGACY] ?? props.tone)
  watchEffect(() => {
    const legacy = LEGACY[props.tone as keyof typeof LEGACY]
    if (legacy) {
      warnOnce(`BlMsg: tone "${props.tone}" is now "${legacy}". The old name is removed in v1.`)
    }
  })
  const toneClass = computed(() =>
    resolved.value === 'neutral' ? undefined : `bl-msg--${resolved.value}`
  )
</script>
