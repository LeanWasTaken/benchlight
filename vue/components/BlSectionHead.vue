<template>
  <div
    class="bl-section-head"
    :class="{ 'bl-section-head--bar': bar, 'bl-section-head--ruled': ruled }"
  >
    <template v-if="bar">
      <component :is="headingTag" class="bl-section-head__eyebrow">{{ eyebrow }}</component>
      <div v-if="$slots['actions']" class="bl-section-head__actions"><slot name="actions" /></div>
    </template>
    <template v-else>
      <p v-if="eyebrow" class="bl-section-head__eyebrow">{{ eyebrow }}</p>
      <component :is="headingTag" class="bl-section-head__heading">{{ heading }}</component>
      <div v-if="$slots['actions']" class="bl-section-head__actions"><slot name="actions" /></div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, watchEffect } from 'vue'
  import { warnOnce } from '../internal/dev'

  const props = withDefaults(
    defineProps<{
      eyebrow?: string
      heading?: string
      level?: 1 | 2 | 3 | 4 | 5 | 6
      bar?: boolean
      ruled?: boolean
    }>(),
    { level: 2 }
  )
  const headingTag = computed(() => `h${props.level}`)
  // The heading is the section's name for assistive tech; an empty one leaves an empty h-element.
  watchEffect(() => {
    if (!(props.bar ? props.eyebrow : props.heading)) {
      warnOnce(
        props.bar
          ? 'BlSectionHead: `bar` renders the eyebrow as the heading, but `eyebrow` is empty.'
          : 'BlSectionHead: `heading` is empty, so the section has no heading.'
      )
    }
  })
</script>
