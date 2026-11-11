<template>
  <div class="bl-radio" :class="attrs.class" :style="attrs.style as StyleValue">
    <label class="bl-radio__control">
      <input
        ref="input"
        class="bl-radio__input"
        type="radio"
        v-bind="inputAttrs()"
        @change="onChange"
      />
      <span class="bl-radio__dot" aria-hidden="true" />
      <span class="bl-radio__label">{{ label }}</span>
    </label>
    <span v-if="hint" :id="hintId" class="bl-radio__hint">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
  import { inject, onBeforeUnmount, onMounted, ref, useAttrs, useId, type StyleValue } from 'vue'
  import { mergeDescribedBy } from '../internal/describedBy'
  import { warnOnce } from '../internal/dev'
  import { RADIO_GROUP_CONTEXT } from '../internal/radioGroup'

  const props = defineProps<{
    label: string
    value: string | number
    hint?: string
    disabled?: boolean
  }>()
  defineOptions({ inheritAttrs: false })
  const attrs = useAttrs()
  const hintId = useId()
  const input = ref<HTMLInputElement>()
  const group = inject(RADIO_GROUP_CONTEXT, null)

  if (!group) {
    warnOnce(
      'BlRadio: must be used inside a BlRadioGroup, which owns its name and model. ' +
        'It renders a plain radio from its attrs.'
    )
  }

  // class and style belong to the root; every other attr lands on the input. A v-model on a
  // radio is not a prop, so its modelValue pair is dropped rather than leaking to the DOM.
  // Inside a group, the group's name, checked state and required win over the consumer's.
  // The radio's own aria-describedby holds only its own hint, never the group's message.
  function inputAttrs(): Record<string, unknown> {
    const rest: Record<string, unknown> = { ...attrs }
    delete rest['class']
    delete rest['style']
    delete rest['modelValue']
    delete rest['onUpdate:modelValue']
    const own = {
      value: props.value,
      'aria-describedby': mergeDescribedBy(
        props.hint ? hintId : undefined,
        rest['aria-describedby']
      )
    }
    if (!group) return { ...rest, disabled: props.disabled || undefined, ...own }
    return {
      ...rest,
      ...own,
      name: group.name.value,
      checked: group.model.value === props.value,
      disabled: props.disabled || group.disabled.value || undefined,
      required: group.required.value || rest['required']
    }
  }

  function onChange(event: Event): void {
    if (group && (event.target as HTMLInputElement).checked) group.model.value = props.value
  }

  let unregister: (() => void) | undefined
  onMounted(() => {
    if (group && input.value) unregister = group.register(input.value, () => props.value)
  })
  onBeforeUnmount(() => unregister?.())
</script>
