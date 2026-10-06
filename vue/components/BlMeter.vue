<template>
  <div v-if="wrapped" class="bl-meter-field" :class="attrs.class" :style="attrs.style as any">
    <div v-if="showLabel || visibleValue !== undefined" class="bl-meter-field__head">
      <span v-if="showLabel" :id="labelId" class="bl-meter-field__label">{{ label }}</span>
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
  import { computed, useAttrs, useId } from 'vue'

  const props = defineProps<{
    value: number | null
    label: string
    valueText?: string
    showLabel?: boolean
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
    const labelled = props.showLabel
    return {
      role: 'progressbar',
      'aria-label': labelled ? undefined : props.label,
      'aria-labelledby': labelled ? labelId : undefined,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuenow': indeterminate.value ? undefined : Math.round(fraction.value * 100),
      'aria-valuetext': props.valueText,
      'data-indeterminate': indeterminate.value ? '' : undefined,
      ...rest
    }
  }
  const wrapped = computed(() => Boolean(props.showLabel || props.showValue))
</script>
