<template>
  <div class="bl-toggle" :class="attrs.class" :style="attrs.style as any">
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
  </div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, useAttrs, useId } from 'vue'
  import { mergeDescribedBy } from '../internal/describedBy'

  const props = defineProps<{
    label: string
    hint?: string
    disabled?: boolean
    name?: string
    value?: string
  }>()
  const model = defineModel<boolean>({ default: false })
  defineOptions({ inheritAttrs: false })
  const attrs = useAttrs()
  const hintId = useId()
  const input = ref<HTMLInputElement>()

  // class and style belong to the root; every other fallthrough attribute lands on the input.
  // Evaluated in render, so attr changes re-run it. A consumer's aria-describedby is merged
  // with the hint id instead of replacing it.
  function inputAttrs(): Record<string, unknown> {
    const rest = { ...attrs }
    delete rest.class
    delete rest.style
    return {
      ...rest,
      'aria-describedby': mergeDescribedBy(
        props.hint ? hintId : undefined,
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
    initial = model.value
    if (input.value) input.value.defaultChecked = initial
    form = input.value?.form ?? null
    form?.addEventListener('reset', onReset)
  })
  onBeforeUnmount(() => form?.removeEventListener('reset', onReset))
</script>
