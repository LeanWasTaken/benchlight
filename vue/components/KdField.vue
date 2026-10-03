<template>
  <div class="kd-field">
    <label class="kd-field__label" :for="fieldId">{{ label }}</label>
    <slot :id="fieldId" />
    <p v-if="hint" class="kd-field__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
  import { computed, useId } from 'vue'

  const props = defineProps<{ label: string; hint?: string; id?: string }>()
  const generated = useId()
  const fieldId = computed(() => props.id ?? generated)
</script>
