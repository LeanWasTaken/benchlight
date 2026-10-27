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
  import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
  import type { SegmentedOption } from '../types'

  const props = defineProps<{
    options: SegmentedOption<T>[]
    ariaLabel?: string
    compact?: boolean
    name?: string
  }>()
  const model = defineModel<T>()
  const generatedName = useId()
  const groupName = computed(() => props.name || generatedName)
  const root = ref<HTMLElement>()

  // A native form reset flips `checked` without an input or change event. The reset event fires
  // before the controls reset, so restore each radio's `defaultChecked` from the mount value
  // synchronously, then read the result in a macrotask (as BlRadioGroup does).
  let form: HTMLFormElement | null = null
  let initial: T | undefined
  function inputs(): HTMLInputElement[] {
    return [...(root.value?.querySelectorAll<HTMLInputElement>('input') ?? [])]
  }
  function onReset(): void {
    inputs().forEach((input, i) => {
      input.defaultChecked = props.options[i]?.value === initial
    })
    setTimeout(() => {
      const index = inputs().findIndex((input) => input.checked)
      model.value = props.options[index]?.value
    }, 0)
  }
  onMounted(() => {
    initial = model.value
    form = root.value?.closest('form') ?? null
    form?.addEventListener('reset', onReset)
  })
  onBeforeUnmount(() => form?.removeEventListener('reset', onReset))
</script>
