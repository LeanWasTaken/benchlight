<template>
  <input v-model="model" class="bl-input" :type="type" v-bind="inputAttrs()" />
</template>

<script setup lang="ts">
  import { inject, useAttrs } from 'vue'
  import { FIELD_CONTEXT } from '../types'
  import { mergeDescribedBy } from '../internal/describedBy'

  withDefaults(defineProps<{ type?: string }>(), { type: 'text' })
  defineOptions({ inheritAttrs: false })
  const model = defineModel<string>({ default: '' })
  const field = inject(FIELD_CONTEXT, null)
  const attrs = useAttrs()
  // The field context supplies `id` and the hint id; a consumer `id` wins, and a consumer
  // `aria-describedby` is merged after the hint id. Evaluated in render, so attr changes re-run it.
  function inputAttrs(): Record<string, unknown> {
    return {
      id: field?.id.value,
      ...attrs,
      'aria-describedby': mergeDescribedBy(field?.describedBy.value, attrs['aria-describedby'])
    }
  }
</script>
