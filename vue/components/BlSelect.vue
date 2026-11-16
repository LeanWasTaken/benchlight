<template>
  <span class="bl-select-wrap" :class="attrs.class" :style="attrs.style as StyleValue">
    <select ref="el" v-model="model" class="bl-select" :disabled="disabled" v-bind="selectAttrs()">
      <option v-for="option in options" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </span>
</template>

<script setup lang="ts" generic="T extends string | number">
  import { inject, onMounted, ref, useAttrs, type StyleValue } from 'vue'
  import { FIELD_CONTEXT, type SelectOption } from '../types'
  import { mergeDescribedBy } from '../internal/describedBy'
  import { controlId } from '../internal/fieldId'
  import { useFormReset } from '../internal/useFormReset'

  const props = defineProps<{ options: readonly SelectOption<T>[]; disabled?: boolean }>()
  defineOptions({ inheritAttrs: false })
  const model = defineModel<T>()
  const field = inject(FIELD_CONTEXT, null)
  const attrs = useAttrs()
  const el = ref<HTMLSelectElement>()
  // A native form reset changes the selection without a change event. The mount-time model is
  // the default (as in the other controls, see BlInput), written as the option's `selected` attribute (`defaultSelected`) just before
  // the reset; with no matching option the browser selects the first. The selected option is then
  // mapped back to its typed value (the DOM value is always a string).
  let initial: T | undefined
  onMounted(() => (initial = model.value))
  useFormReset(
    el,
    () => {
      const index = el.value?.selectedIndex ?? -1
      if (index < 0) return
      const value = props.options[index]?.value
      if (value !== undefined && value !== model.value) model.value = value
    },
    () => {
      if (!el.value) return
      for (const [i, option] of [...el.value.options].entries())
        option.toggleAttribute('selected', props.options[i]?.value === initial)
    }
  )
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
