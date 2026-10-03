<template>
  <dl class="kd-spec-panel">
    <slot>
      <KdSpecRow
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
  import KdSpecRow from './KdSpecRow.vue'

  withDefaults(defineProps<{ rows?: SpecRowData[] }>(), { rows: () => [] })
</script>
