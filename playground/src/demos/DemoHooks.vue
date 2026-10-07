<template>
  <BlSpecPanel class="pg-stack">
    <BlSpecRow label="useAppearance" :value="`${mode} → ${resolved}`" />
    <BlSpecRow label="useReducedMotion" :value="String(reduced)" />
    <BlSpecRow label="useScrollLifted(24)" :value="String(lifted)" />
    <BlSpecRow label="riseDelay(3, step 40)" :value="JSON.stringify(riseDelay(3, { step: 40 }))" />
    <BlSpecRow label="ansiToSegments" :value="`${segments.length} segments`" />
  </BlSpecPanel>

  <BlSectionHead :level="3" eyebrow="ansiToSegments" heading="Coloured runs" />
  <div class="pg-row">
    <span v-for="(segment, index) in segments" :key="index" :class="segment.className">{{
      segment.text
    }}</span>
  </div>

  <BlSectionHead :level="3" eyebrow="useFollowScroll" heading="A custom scroller" />
  <div class="pg-stack">
    <div
      ref="scroller"
      class="pg-scroller"
      role="region"
      aria-label="Follow-scroll demo"
      tabindex="0"
    >
      <p v-for="n in 12" :key="n" class="bl-annotation">Row {{ n }}</p>
    </div>
    <span class="bl-annotation">pinned: {{ pinned }}</span>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import {
    BlSectionHead,
    BlSpecPanel,
    BlSpecRow,
    ansiToSegments,
    riseDelay,
    useAppearance,
    useFollowScroll,
    useReducedMotion,
    useScrollLifted
  } from '../../../vue'

  const { mode, resolved } = useAppearance()
  const reduced = useReducedMotion()
  const lifted = useScrollLifted(24)
  const segments = ansiToSegments('\x1b[32mok\x1b[0m plain \x1b[91mfail\x1b[39m done')

  const scroller = ref<HTMLElement | null>(null)
  const { pinned } = useFollowScroll(scroller)
</script>
