<template>
  <component :is="as" class="kd-meta">
    <template v-for="(item, index) in normalized" :key="index">
      <span v-if="separator && index > 0" class="kd-meta__sep" aria-hidden="true">—</span>
      <span :class="item.class">{{ item.text }}</span>
    </template>
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
