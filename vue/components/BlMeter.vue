<template>
  <div v-if="wrapped" class="bl-meter-field" :class="attrs.class" :style="attrs.style as any">
    <div v-if="label || visibleValue !== undefined" class="bl-meter-field__head">
      <span v-if="label" :id="labelId" class="bl-meter-field__label">{{ label }}</span>
      <span v-if="visibleValue !== undefined" class="bl-meter-field__value" aria-hidden="true">{{
        visibleValue
      }}</span>
    </div>
    <div class="bl-meter" v-bind="barAttrs()">
      <div
        class="bl-meter__fill"
        :style="indeterminate ? undefined : { '--bl-meter-value': fraction }"
      />
    </div>
  </div>
  <div v-else class="bl-meter" :class="attrs.class" :style="attrs.style as any" v-bind="barAttrs()">
    <div
      class="bl-meter__fill"
      :style="indeterminate ? undefined : { '--bl-meter-value': fraction }"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, useAttrs, useId, watch } from 'vue'
  import { warn } from '../internal/dev'

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
  const attrs = useAttrs()
  const labelId = useId()
  const indeterminate = computed(() => props.value === null)
  const fraction = computed(() => {
    const value = props.value ?? 0
    return Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value))
  })
  // The visible value: nothing while indeterminate; it is aria-hidden as the bar exposes it.
  const visibleValue = computed(() =>
    props.showValue && !indeterminate.value
      ? (props.valueText ?? `${Math.round(fraction.value * 100)}%`)
      : undefined
  )
  // The progressbar's attributes; class and style belong to the outer element, every other
  // fallthrough attribute lands here. A function evaluated in render, so it re-runs on any
  // attr change.
  function barAttrs(): Record<string, unknown> {
    const rest = { ...attrs }
    delete rest.class
    delete rest.style
    const labelled = Boolean(props.label)
    return {
      role: 'progressbar',
      'aria-label': labelled ? undefined : props.ariaLabel,
      'aria-labelledby': labelled ? labelId : undefined,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuenow': indeterminate.value ? undefined : Math.round(fraction.value * 100),
      'aria-valuetext': props.valueText,
      'data-indeterminate': indeterminate.value ? '' : undefined,
      ...rest
    }
  }
  const wrapped = computed(() => Boolean(props.label) || Boolean(props.showValue))
  watch(
    () => [props.label, props.ariaLabel, attrs['aria-labelledby']],
    ([label, ariaLabel, labelledby]) => {
      if (!label && ariaLabel === undefined && labelledby === undefined)
        warn('BlMeter: set `label` (visible) or `ariaLabel` (`aria-label`) to name the meter.')
    },
    { immediate: true }
  )
</script>
