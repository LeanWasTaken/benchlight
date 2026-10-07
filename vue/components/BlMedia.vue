<template>
  <component :is="as ?? 'div'" class="bl-media" :class="{ 'bl-media--center': align === 'center' }">
    <Part part="figure" :nodes="$slots.figure?.()" />
    <div class="bl-media__body"><slot /></div>
    <Part part="aside" :nodes="$slots.aside?.()" />
  </component>
</template>

<script setup lang="ts">
  import { h, type VNode } from 'vue'
  import { hasContent } from '../internal/slots'

  defineProps<{ as?: 'div' | 'li' | 'article'; align?: 'start' | 'center' }>()
  defineSlots<{ default?: () => VNode[]; figure?: () => VNode[]; aside?: () => VNode[] }>()

  // Each optional slot is evaluated once per render; its wrapper is dropped when it is empty.
  const Part = (p: { part: string; nodes?: VNode[] }) =>
    hasContent(p.nodes) ? h('div', { class: `bl-media__${p.part}` }, p.nodes) : null
</script>
