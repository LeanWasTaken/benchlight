<template>
  <input v-model="model" class="kd-input" :type="type" />
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ type?: string }>(), { type: 'text' })
  const model = defineModel<string>({ default: '' })
</script>
