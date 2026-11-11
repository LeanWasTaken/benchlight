<template>
  <div class="bl-checkbox" :class="attrs.class" :style="attrs.style as StyleValue">
    <label class="bl-checkbox__control">
      <input
        ref="input"
        class="bl-checkbox__input"
        type="checkbox"
        :checked="model"
        :disabled="disabled"
        :name="name"
        :value="value"
        v-bind="inputAttrs()"
        @change="onChange"
      />
      <span class="bl-checkbox__box" aria-hidden="true" />
      <span class="bl-checkbox__label">{{ label }}</span>
    </label>
    <span v-if="hint" :id="hintId" class="bl-checkbox__hint">{{ hint }}</span>
    <span
      v-if="error"
      :id="errorId"
      class="bl-checkbox__error"
      :role="announce ? 'alert' : undefined"
      >{{ error }}</span
    >
  </div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, useAttrs, useId, watch, type StyleValue } from 'vue'
  import { mergeDescribedBy } from '../internal/describedBy'

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
  const indeterminate = defineModel<boolean>('indeterminate', { default: false })
  defineOptions({ inheritAttrs: false })
  const attrs = useAttrs()
  const hintId = useId()
  const errorId = useId()
  const input = ref<HTMLInputElement>()

  // class and style belong to the root; every other fallthrough attribute lands on the input.
  // A consumer's aria-describedby is merged with the hint and error ids instead of replacing
  // it. A consumer's aria-invalid wins.
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

  // `indeterminate` is a DOM property with no attribute, so it is written from script: on
  // mount (nothing renders it on the server) and whenever the model changes.
  function syncIndeterminate(): void {
    if (input.value) input.value.indeterminate = indeterminate.value
  }
  watch(indeterminate, syncIndeterminate)

  function onChange(event: Event): void {
    model.value = (event.target as HTMLInputElement).checked
    // A user click clears the native property while the prop may still say true.
    if (indeterminate.value) indeterminate.value = false
  }

  // A native form reset flips `checked` without an input or change event. The reset event
  // fires before the controls reset, and a microtask can run before the reset algorithm, so
  // read the value in a macrotask. `defaultChecked` is set on mount so a reset restores the
  // value the checkbox had then, as a plain checkbox does.
  let form: HTMLFormElement | null = null
  let initial = false
  function onReset(): void {
    // Vue's re-renders rewrite the `checked` attribute, so restore the mount value synchronously,
    // before the reset algorithm reads `defaultChecked`.
    if (input.value) input.value.defaultChecked = initial
    setTimeout(() => {
      if (input.value) model.value = input.value.checked
    }, 0)
  }
  onMounted(() => {
    syncIndeterminate()
    initial = model.value
    if (input.value) input.value.defaultChecked = initial
    form = input.value?.form ?? null
    form?.addEventListener('reset', onReset)
  })
  onBeforeUnmount(() => form?.removeEventListener('reset', onReset))
</script>
