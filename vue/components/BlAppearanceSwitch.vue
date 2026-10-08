<template>
  <fieldset class="bl-appearance" :data-ready="ready ? '' : undefined">
    <legend class="bl-sr-only">{{ text.legend }}</legend>
    <div class="bl-appearance__track">
      <label v-for="option in options" :key="option.value" class="bl-appearance__option">
        <input
          v-model="mode"
          type="radio"
          :name="groupName"
          :value="option.value"
          :aria-label="option.label"
        />
        {{ option.mark }}
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, useId } from 'vue'
  import { useAppearance, type AppearanceMode } from '../composables/useAppearance'
  import { mergeLabels } from '../internal/labels'
  import type { AppearanceLabels } from '../types'

  const props = defineProps<{ labels?: Partial<AppearanceLabels> }>()
  const { mode } = useAppearance()
  // Until mounted the switch draws from the root attribute and does not animate, so a saved
  // choice never visibly slides in after hydration (the server always renders "auto").
  const ready = ref(false)
  onMounted(() => {
    ready.value = true
  })
  const groupName = `bl-appearance-${useId()}`

  const text = computed<AppearanceLabels>(() =>
    mergeLabels({ legend: 'Appearance', auto: 'Auto', light: 'Light', dark: 'Dark' }, props.labels)
  )
  const marks = computed(() =>
    mergeLabels({ auto: 'A', light: 'L', dark: 'D' }, props.labels?.marks)
  )

  const MODES: AppearanceMode[] = ['auto', 'light', 'dark']
  const options = computed(() =>
    MODES.map((value) => ({ value, label: text.value[value], mark: marks.value[value] }))
  )
</script>
