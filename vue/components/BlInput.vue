<template>
  <input
    :id="field?.id.value"
    v-model="model"
    class="bl-input"
    :type="type"
    :aria-describedby="field?.describedBy.value"
  />
</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import { FIELD_CONTEXT } from '../types'

  withDefaults(defineProps<{ type?: string }>(), { type: 'text' })
  const model = defineModel<string>({ default: '' })
  const field = inject(FIELD_CONTEXT, null)
</script>
