<template>
  <textarea
    v-model="model"
    class="bl-textarea"
    :rows="rows"
    :disabled="disabled"
    v-bind="textareaAttrs()"
  ></textarea>
</template>

<script setup lang="ts">
  import { inject, useAttrs } from 'vue'
  import { FIELD_CONTEXT } from '../types'
  import { mergeDescribedBy } from '../internal/describedBy'
  import { controlId } from '../internal/fieldId'

  withDefaults(defineProps<{ rows?: number; disabled?: boolean }>(), { rows: 4 })
  defineOptions({ inheritAttrs: false })
  const model = defineModel<string>({ default: '' })
  const field = inject(FIELD_CONTEXT, null)
  const attrs = useAttrs()
  // The field context supplies `id` and the hint id; the field's `id` wins over a consumer `id`, and a consumer
  // `aria-describedby` is merged after the hint id. Evaluated in render, so attr changes re-run it.
  function textareaAttrs(): Record<string, unknown> {
    return {
      'aria-invalid': field?.invalid?.value === true ? 'true' : undefined,
      ...attrs,
      id: controlId('BlTextarea', field, attrs['id']),
      'aria-describedby': mergeDescribedBy(field?.describedBy.value, attrs['aria-describedby'])
    }
  }
</script>
