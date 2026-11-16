<template>
  <div class="bl-toggle" :class="attrs.class" :style="attrs.style as StyleValue">
    <label class="bl-toggle__control">
      <input
        ref="input"
        class="bl-toggle__input"
        type="checkbox"
        role="switch"
        :checked="model"
        :disabled="disabled"
        :name="name"
        :value="value"
        v-bind="inputAttrs()"
        @change="onChange"
      />
      <span class="bl-toggle__track" aria-hidden="true"><span class="bl-toggle__thumb" /></span>
      <span class="bl-toggle__label">{{ label }}</span>
    </label>
    <span v-if="hint" :id="hintId" class="bl-toggle__hint">{{ hint }}</span>
    <span
      v-if="error"
      :id="errorId"
      class="bl-toggle__error"
      :role="announce ? 'alert' : undefined"
      >{{ error }}</span
    >
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref, useAttrs, useId, type StyleValue } from 'vue'
  import { mergeDescribedBy } from '../internal/describedBy'
  import { useFormReset } from '../internal/useFormReset'

  const props = defineProps<{
    label: string
    hint?: string
    error?: string
    announce?: boolean
    disabled?: boolean
    name?: string
    value?: string
  }>()
  const model = defineModel<boolean>({ default: false })
  defineOptions({ inheritAttrs: false })
  const attrs = useAttrs()
  const hintId = useId()
  const errorId = useId()
  const input = ref<HTMLInputElement>()

  // class and style belong to the root; every other fallthrough attribute lands on the input.
  // Evaluated in render, so attr changes re-run it. A consumer's aria-describedby is merged
  // with the hint and error ids instead of replacing it. A consumer's aria-invalid wins.
  function inputAttrs(): Record<string, unknown> {
    const rest = { ...attrs }
    delete rest.class
    delete rest.style
    return {
      ...(props.error ? { 'aria-invalid': 'true' } : {}),
      ...rest,
      'aria-describedby': mergeDescribedBy(
        props.hint ? hintId : undefined,
        props.error ? errorId : undefined,
        rest['aria-describedby']
      )
    }
  }

  function onChange(event: Event): void {
    model.value = (event.target as HTMLInputElement).checked
  }

  // A native form reset flips `checked` without an input or change event. The reset event
  // fires before the controls reset, and a microtask can run before the reset algorithm, so
  // read the value in a macrotask. `defaultChecked` is set on mount so a reset restores the
  // value the toggle had then, as a plain checkbox does.
  let initial = false
  useFormReset(
    input,
    () => {
      if (input.value) model.value = input.value.checked
    },
    // Vue's re-renders rewrite the `checked` attribute, so restore the mount value synchronously,
    // before the reset algorithm reads `defaultChecked`.
    () => {
      if (input.value) input.value.defaultChecked = initial
    }
  )
  onMounted(() => {
    initial = model.value
    if (input.value) input.value.defaultChecked = initial
  })
</script>
