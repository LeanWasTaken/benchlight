<template>
  <span class="bl-select-wrap" :class="attrs.class" :style="attrs.style as any">
    <select v-model="model" class="bl-select" v-bind="selectAttrs()">
      <option v-for="option in options" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </span>
</template>

<script setup lang="ts" generic="T extends string | number">
  import { inject, useAttrs } from 'vue'
  import { FIELD_CONTEXT, type SelectOption } from '../types'
  import { mergeDescribedBy } from '../internal/describedBy'

  defineProps<{ options: SelectOption<T>[] }>()
  defineOptions({ inheritAttrs: false })
  const model = defineModel<T>()
  const field = inject(FIELD_CONTEXT, null)
  const attrs = useAttrs()
  // class and style belong to the wrapper; every other fallthrough attribute lands on the
  // select. A consumer `id` wins over the field context; a consumer `aria-describedby` is merged
  // after the hint id. A function evaluated in render, so it re-runs on any attr change.
  function selectAttrs(): Record<string, unknown> {
    const rest = {
      id: field?.id.value,
      'aria-invalid': field?.invalid?.value === true ? 'true' : undefined,
      ...attrs
    }
    delete rest.class
    delete rest.style
    return {
      ...rest,
      'aria-describedby': mergeDescribedBy(field?.describedBy.value, attrs['aria-describedby'])
    }
  }
</script>
