<template>
  <div
    ref="root"
    class="bl-segmented"
    :class="{ 'bl-segmented--compact': compact }"
    role="radiogroup"
    :aria-label="ariaLabel"
  >
    <label v-for="option in options" :key="String(option.value)" class="bl-segmented__item">
      <input
        type="radio"
        :name="groupName"
        :form="form"
        :value="String(option.value)"
        :checked="option.value === model"
        :disabled="option.disabled || undefined"
        @change="model = option.value"
      />
      {{ option.label }}
    </label>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number | null">
  import { computed, onMounted, ref, useAttrs, useId } from 'vue'
  import { warnOnce } from '../internal/dev'
  import { useFormReset } from '../internal/useFormReset'
  import type { SegmentedOption } from '../types'

  const props = defineProps<{
    options: readonly SegmentedOption<T>[]
    ariaLabel?: string
    compact?: boolean
    name?: string
    /** Id of a form outside the group; the radios belong to it, so its reset reaches them. */
    form?: string
  }>()
  const attrs = useAttrs()
  if (!props.ariaLabel && !attrs['aria-labelledby'])
    warnOnce('BlSegmented: set `ariaLabel` (`aria-label`) to name the group.')
  const model = defineModel<T>()
  const generatedName = useId()
  const groupName = computed(() => props.name || generatedName)
  const root = ref<HTMLElement>()

  // A native form reset flips `checked` without an input or change event. The reset event fires
  // before the controls reset, so restore each radio's `defaultChecked` from the mount value
  // synchronously, then read the result in a macrotask (as BlRadioGroup does).
  let initial: T | undefined
  function inputs(): HTMLInputElement[] {
    return [...(root.value?.querySelectorAll<HTMLInputElement>('input') ?? [])]
  }
  useFormReset(
    root,
    () => {
      const index = inputs().findIndex((input) => input.checked)
      model.value = props.options[index]?.value
    },
    () => {
      inputs().forEach((input, i) => {
        input.defaultChecked = props.options[i]?.value === initial
      })
    }
  )
  onMounted(() => {
    initial = model.value
  })
</script>
