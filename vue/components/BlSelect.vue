<template>
  <span class="bl-select-wrap" :class="attrs.class" :style="attrs.style as StyleValue">
    <select v-model="model" class="bl-select" :disabled="disabled" v-bind="selectAttrs()">
      <option v-for="option in options" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </span>
</template>

<script setup lang="ts" generic="T extends string | number">
  import { inject, useAttrs, type StyleValue } from 'vue'
  import { FIELD_CONTEXT, type SelectOption } from '../types'
  import { mergeDescribedBy } from '../internal/describedBy'
  import { controlId } from '../internal/fieldId'

  defineProps<{ options: readonly SelectOption<T>[]; disabled?: boolean }>()
  defineOptions({ inheritAttrs: false })
  const model = defineModel<T>()
  const field = inject(FIELD_CONTEXT, null)
  const attrs = useAttrs()
  // class and style belong to the wrapper; every other fallthrough attribute lands on the
  // select. The field context's `id` wins over a consumer `id`; a consumer `aria-describedby` is merged
  // after the hint id. A function evaluated in render, so it re-runs on any attr change.
  function selectAttrs(): Record<string, unknown> {
    const rest = {
      'aria-invalid': field?.invalid?.value === true ? 'true' : undefined,
      ...attrs
    }
    delete rest.class
    delete rest.style
    return {
      ...rest,
      id: controlId('BlSelect', field, attrs['id']),
      'aria-describedby': mergeDescribedBy(field?.describedBy.value, attrs['aria-describedby'])
    }
  }
</script>
