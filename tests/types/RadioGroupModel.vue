<!-- Type fixture: `bun run typecheck` fails if BlRadioGroup's v-model stops accepting a model
     that starts with no selection (`undefined`), under exactOptionalPropertyTypes. -->
<template>
  <BlRadioGroup v-model="choice" legend="Plan">
    <BlRadio label="Basic" value="basic" />
    <BlRadio label="Pro" :value="2" />
  </BlRadioGroup>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import BlRadio from '../../vue/components/BlRadio.vue'
  import BlRadioGroup from '../../vue/components/BlRadioGroup.vue'

  const choice = ref<string | number | undefined>(undefined)
</script>
