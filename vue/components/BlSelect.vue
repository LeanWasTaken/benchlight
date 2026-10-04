<template>
  <select
    :id="field?.id.value"
    v-model="model"
    class="bl-select"
    :aria-describedby="field?.describedBy.value"
  >
    <option v-for="option in options" :key="String(option.value)" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>

<script setup lang="ts" generic="T extends string | number">
  import { inject } from 'vue'
  import { FIELD_CONTEXT, type SelectOption } from '../types'

  defineProps<{ options: SelectOption<T>[] }>()
  const model = defineModel<T>()
  const field = inject(FIELD_CONTEXT, null)
</script>
