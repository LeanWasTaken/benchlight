<template>
  <fieldset class="bl-switch" :data-ready="ready ? '' : undefined">
    <legend class="bl-sr-only">{{ text.legend }}</legend>
    <div class="bl-switch__track">
      <label v-for="option in options" :key="option.value" class="bl-switch__option">
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

  const text = computed<AppearanceLabels>(() => ({
    legend: 'Appearance',
    auto: 'Auto',
    light: 'Light',
    dark: 'Dark',
    ...props.labels
  }))

  const MODES: AppearanceMode[] = ['auto', 'light', 'dark']
  const options = computed(() =>
    MODES.map((value) => ({ value, label: text.value[value], mark: value[0]!.toUpperCase() }))
  )
</script>
