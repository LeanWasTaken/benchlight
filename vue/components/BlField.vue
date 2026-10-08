<template>
  <div class="bl-field">
    <label class="bl-field__label" :for="fieldId">{{ label }}</label>
    <slot :id="fieldId" :described-by="describedBy" />
    <p v-if="hint" :id="hintId" class="bl-field__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
  import { computed, provide, useId } from 'vue'
  import { FIELD_CONTEXT } from '../types'

  const props = defineProps<{ label: string; hint?: string; id?: string }>()
  const generated = useId()
  const fieldId = computed(() => props.id ?? generated)
  const hintId = computed(() => `${fieldId.value}-hint`)
  const describedBy = computed(() => (props.hint ? hintId.value : undefined))
  provide(FIELD_CONTEXT, { id: fieldId, describedBy })
</script>
