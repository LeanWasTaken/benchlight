<template>
  <div v-if="wrapped" class="bl-meter-field" :class="attrs.class" :style="attrs.style as any">
    <div v-if="label || visibleValue !== undefined" class="bl-meter-field__head">
      <span v-if="label" :id="labelId" class="bl-meter-field__label">{{ label }}</span>
      <span v-if="visibleValue !== undefined" class="bl-meter-field__value" aria-hidden="true">{{
        visibleValue
      }}</span>
    </div>
    <div v-bind="barAttrs()">
      <div
        class="bl-meter__fill"
        :style="indeterminate ? undefined : { '--bl-meter-value': fraction }"
      />
    </div>
  </div>
  <div v-else :class="attrs.class" :style="attrs.style as any" v-bind="barAttrs()">
    <div
      class="bl-meter__fill"
      :style="indeterminate ? undefined : { '--bl-meter-value': fraction }"
    />
  </div>
</template>

<script setup lang="ts">
  import { useMeterBar } from '../internal/meterBar'

  const props = defineProps<{
    value: number | null
    /** Visible text above the bar; it names the bar. */
    label?: string
    /** Accessible name when there is no visible label. */
    ariaLabel?: string
    valueText?: string
    showValue?: boolean
  }>()
  defineOptions({ inheritAttrs: false })
  const { attrs, labelId, indeterminate, fraction, visibleValue, wrapped, barAttrs } = useMeterBar(
    props,
    'progressbar',
    'BlProgress'
  )
</script>
