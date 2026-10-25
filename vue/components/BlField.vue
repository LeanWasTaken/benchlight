<template>
  <div class="bl-field" :class="{ 'bl-field--invalid': invalid }">
    <label class="bl-field__label" :for="fieldId">{{ label }}</label>
    <slot :id="fieldId" :described-by="describedBy" :invalid="invalid" />
    <p v-if="hint" :id="hintId" class="bl-field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="bl-field__error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
  import { computed, provide, useId } from 'vue'
  import { FIELD_CONTEXT } from '../types'
  import { mergeDescribedBy } from '../internal/describedBy'

  const props = defineProps<{ label: string; hint?: string; id?: string; error?: string }>()
  const generated = useId()
  const fieldId = computed(() => props.id ?? generated)
  const hintId = computed(() => `${fieldId.value}-hint`)
  const errorId = computed(() => `${fieldId.value}-error`)
  const invalid = computed(() => !!props.error)
  // Hint first, then the error, so a control that binds `describedBy` gets both.
  const describedBy = computed(() =>
    mergeDescribedBy(
      props.hint ? hintId.value : undefined,
      invalid.value ? errorId.value : undefined
    )
  )
  provide(FIELD_CONTEXT, { id: fieldId, describedBy, invalid })
</script>
