<template>
  <div v-if="wrapped" class="bl-meter-field" :class="attrs.class" :style="attrs.style as any">
    <div v-if="label || visibleValue !== undefined" class="bl-meter-field__head">
      <span v-if="label" :id="labelId" class="bl-meter-field__label">{{ label }}</span>
      <span v-if="visibleValue !== undefined" class="bl-meter-field__value" aria-hidden="true">{{
        visibleValue
      }}</span>
    </div>
    <div v-bind="barAttrs()">
      <div class="bl-meter__fill" :style="{ '--bl-meter-value': fraction }" />
    </div>
  </div>
  <div v-else :class="attrs.class" :style="attrs.style as any" v-bind="barAttrs()">
    <div class="bl-meter__fill" :style="{ '--bl-meter-value': fraction }" />
  </div>
</template>

<script setup lang="ts">
  import { watch } from 'vue'
  import { warnOnce } from '../internal/dev'
  import { useMeterBar } from '../internal/meterBar'

  const props = defineProps<{
    value: number
    /** Visible text above the bar; it names the bar. */
    label?: string
    /** Accessible name when there is no visible label. */
    ariaLabel?: string
    valueText?: string
    showValue?: boolean
  }>()
  defineOptions({ inheritAttrs: false })
  const { attrs, labelId, fraction, visibleValue, wrapped, barAttrs } = useMeterBar(
    props,
    'meter',
    'BlMeter'
  )
  watch(
    () => props.value,
    (value) => {
      if (!(value >= 0 && value <= 1))
        warnOnce(`BlMeter: \`value\` is 0 to 1, got ${value}; it renders clamped.`)
    },
    { immediate: true }
  )
</script>
