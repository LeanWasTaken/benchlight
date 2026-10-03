<template>
  <select v-model="model" class="kd-select">
    <option v-for="option in options" :key="String(option.value)" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>

<script setup lang="ts" generic="T extends string | number">
  import type { SelectOption } from '../types'

  defineProps<{ options: SelectOption<T>[] }>()
  const model = defineModel<T>()
</script>
