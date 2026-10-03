<template>
  <dl class="bl-spec-panel">
    <slot>
      <BlSpecRow
        v-for="row in rows"
        :key="row.label"
        :label="row.label"
        :value="row.value"
        :href="row.href"
      />
    </slot>
  </dl>
</template>

<script setup lang="ts">
  import type { SpecRowData } from '../types'
  import BlSpecRow from './BlSpecRow.vue'

  withDefaults(defineProps<{ rows?: SpecRowData[] }>(), { rows: () => [] })
</script>
