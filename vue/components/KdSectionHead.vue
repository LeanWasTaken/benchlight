<template>
  <header
    class="kd-section-head"
    :class="{ 'kd-section-head--bar': bar, 'kd-section-head--ruled': ruled }"
  >
    <template v-if="bar">
      <component :is="headingTag" class="kd-section-head__eyebrow">{{ eyebrow }}</component>
      <div v-if="$slots.action" class="kd-section-head__action"><slot name="action" /></div>
    </template>
    <template v-else>
      <p v-if="eyebrow" class="kd-section-head__eyebrow">{{ eyebrow }}</p>
      <component :is="headingTag" class="kd-section-head__heading">{{ heading }}</component>
    </template>
  </header>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

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
</script>
