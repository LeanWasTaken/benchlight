<template>
  <component :is="as" class="bl-meta" :class="{ 'bl-meta--sep': separator }">
    <span v-for="(item, index) in normalized" :key="index" :class="item.class">{{
      item.text
    }}</span>
  </component>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { MetaItem } from '../types'

  const props = withDefaults(
    defineProps<{ items: MetaItem[]; separator?: boolean; as?: string }>(),
    { as: 'p' }
  )
  const normalized = computed(() =>
    props.items.map((item) => (typeof item === 'string' ? { text: item } : item))
  )
</script>
