<template>
  <textarea
    ref="el"
    v-model="model"
    class="bl-textarea"
    :rows="rows"
    :disabled="disabled"
    v-bind="textareaAttrs()"
  ></textarea>
</template>

<script setup lang="ts">
  import { inject, onMounted, ref, useAttrs } from 'vue'
  import { FIELD_CONTEXT } from '../types'
  import { mergeDescribedBy } from '../internal/describedBy'
  import { controlId } from '../internal/fieldId'
  import { useFormReset } from '../internal/useFormReset'

  withDefaults(defineProps<{ rows?: number; disabled?: boolean }>(), { rows: 4 })
  defineOptions({ inheritAttrs: false })
  const model = defineModel<string>({ default: '' })
  const field = inject(FIELD_CONTEXT, null)
  const attrs = useAttrs()
  const el = ref<HTMLTextAreaElement>()
  // A reset restores the value the control had when it mounted, as native `defaultValue` does
  // (so later model changes are not the default). Vue sets the `value` property, never the
  // attribute, so the default is written from the mount-time model just before the browser resets.
  let initial = ''
  onMounted(() => (initial = model.value))
  useFormReset(
    el,
    () => {
      if (el.value && el.value.value !== model.value) model.value = el.value.value
    },
    () => {
      if (el.value) el.value.defaultValue = initial
    }
  )
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
