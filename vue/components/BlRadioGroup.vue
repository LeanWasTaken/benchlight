<template>
  <fieldset
    ref="root"
    class="bl-fieldset bl-radio-group"
    :class="{ 'bl-fieldset--invalid': invalid }"
    v-bind="fieldsetAttrs()"
    role="radiogroup"
  >
    <legend class="bl-fieldset__legend">{{ legend }}</legend>
    <p v-if="hint" :id="hintId" class="bl-fieldset__hint">{{ hint }}</p>
    <p v-if="invalid" :id="errorId" class="bl-fieldset__error">{{ error }}</p>
    <slot />
  </fieldset>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, provide, ref, useAttrs, useId } from 'vue'
  import { mergeDescribedBy } from '../internal/describedBy'
  import { RADIO_GROUP_CONTEXT } from '../internal/radioGroup'

  const props = defineProps<{
    legend: string
    hint?: string
    error?: string
    disabled?: boolean
    required?: boolean
    name?: string
  }>()
  // No selection is `undefined` (a reset with nothing checked emits it), so the type accepts it.
  // A `| undefined` type param alone compiles to `type: null` (no runtime check), so the runtime
  // type is spelled out; Vue spreads it over the inferred one.
  const model = defineModel<string | number | undefined>({ type: [String, Number] })
  defineOptions({ inheritAttrs: false })
  const attrs = useAttrs()
  const generatedName = useId()
  const hintId = useId()
  const errorId = useId()
  const root = ref<HTMLFieldSetElement>()
  // Truthy, so `error=""` is not invalid.
  const invalid = computed(() => Boolean(props.error))

  // Every attr lands on the fieldset (Vue merges class and style with the static ones). A
  // consumer's aria-invalid wins; a consumer's aria-describedby follows the hint and error ids.
  function fieldsetAttrs(): Record<string, unknown> {
    return {
      ...(invalid.value ? { 'aria-invalid': 'true' } : {}),
      ...(props.required ? { 'aria-required': 'true' } : {}),
      ...attrs,
      'aria-describedby': mergeDescribedBy(
        props.hint ? hintId : undefined,
        invalid.value ? errorId : undefined,
        attrs['aria-describedby']
      )
    }
  }

  // Each radio registers its input and typed value, so a reset can map the checked input back
  // to a number or string without reading the DOM's string `value`.
  const radios = new Map<HTMLInputElement, () => string | number>()
  let mounted = false
  let initial: string | number | undefined
  function syncDefaults(): void {
    for (const [input, value] of radios) input.defaultChecked = value() === initial
  }

  provide(RADIO_GROUP_CONTEXT, {
    name: computed(() => props.name || generatedName),
    model,
    disabled: computed(() => props.disabled),
    required: computed(() => props.required),
    register(input, value) {
      radios.set(input, value)
      if (mounted) input.defaultChecked = value() === initial
      return () => radios.delete(input)
    }
  })

  // A native form reset flips `checked` without an input or change event. The reset event fires
  // before the controls reset, so restore each radio's `defaultChecked` from the mount value
  // synchronously (Vue's re-renders may have rewritten it), then read the result in a macrotask.
  let form: HTMLFormElement | null = null
  function onReset(): void {
    syncDefaults()
    setTimeout(() => {
      let checked: string | number | undefined
      for (const [input, value] of radios) if (input.checked) checked = value()
      model.value = checked
    }, 0)
  }
  onMounted(() => {
    mounted = true
    initial = model.value
    syncDefaults()
    form = root.value?.form ?? null
    form?.addEventListener('reset', onReset)
  })
  onBeforeUnmount(() => form?.removeEventListener('reset', onReset))
</script>
