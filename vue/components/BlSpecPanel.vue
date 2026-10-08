<template>
  <dl class="bl-spec-panel">
    <slot>
      <BlSpecRow
        v-for="(row, index) in rows"
        :key="index"
        :label="row.label"
        :value="row.value"
        :as="row.as"
        :to="row.to"
        :href="row.href"
        :external="row.external"
      />
    </slot>
  </dl>
</template>

<script setup lang="ts">
  import type { SpecRowData } from '../types'
  import BlSpecRow from './BlSpecRow.vue'

  withDefaults(defineProps<{ rows?: SpecRowData[] }>(), { rows: () => [] })
</script>
