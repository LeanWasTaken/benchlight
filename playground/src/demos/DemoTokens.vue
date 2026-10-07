<template>
  <div class="pg-swatches">
    <div v-for="name in colorNames" :key="name" class="pg-swatch">
      <span class="pg-chip" :style="{ background: `var(--bl-${name})` }" />
      <span class="bl-annotation">--bl-{{ name }}</span>
    </div>
  </div>

  <BlSectionHead :level="3" eyebrow="Tints" heading="Washes behind ink" />
  <div class="pg-swatches">
    <div v-for="tint in tints" :key="tint" :class="`bl-tint-${tint}`" class="pg-tint">
      <span>{{ tint }}</span>
      <span>.bl-tint-{{ tint }}</span>
    </div>
  </div>

  <BlSectionHead :level="3" eyebrow="Type" heading="Voices" />
  <div class="pg-stack">
    <span class="bl-display bl-display--xl">Display XL</span>
    <span class="bl-display bl-display--lg">Display LG</span>
    <span class="bl-display bl-display--md">Display MD</span>
    <p class="bl-lede">Lede: one sentence that sets up the page.</p>
    <div class="pg-row">
      <span class="bl-silkscreen">Silkscreen</span>
      <span class="bl-annotation">Annotation 2026-10-03</span>
    </div>
  </div>

  <BlSectionHead :level="3" eyebrow="Motion" heading="Staggered entrance" />
  <div class="pg-row">
    <span
      v-for="n in 4"
      :key="n"
      class="bl-rise bl-annotation"
      :style="riseDelay(n - 1, { step: 80, cap: 3 })"
      >step {{ n }}</span
    >
  </div>
</template>

<script setup lang="ts">
  import { colorNames } from '../../../tokens/tokens'
  import { BlSectionHead, riseDelay } from '../../../vue'

  const tints = ['trace', 'copper', 'phosphor', 'danger'] as const
</script>
