import { computed, useAttrs, useId, watch } from 'vue'
import { warn } from './dev'

interface MeterBarProps {
  value: number | null
  label?: string | undefined
  ariaLabel?: string | undefined
  valueText?: string | undefined
  showValue?: boolean | undefined
}

// The state and bar attributes BlMeter and BlProgress share; they differ only in role, in
// whether `value` may be null, and in the name used in warnings.
export function useMeterBar(
  props: MeterBarProps,
  role: 'meter' | 'progressbar',
  component: string
) {
  const attrs = useAttrs()
  const labelId = useId()
  // Only a progressbar can be indeterminate; a meter given null at runtime reads as 0.
  const indeterminate = computed(() => role === 'progressbar' && props.value === null)
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
  const wrapped = computed(() => Boolean(props.label) || Boolean(props.showValue))
  // The bar's attributes; class and style belong to the outer element, every other fallthrough
  // attribute lands here. A function evaluated in render, so it re-runs on any attr change.
  function barAttrs(): Record<string, unknown> {
    const rest = { ...attrs }
    delete rest.class
    delete rest.style
    const labelled = Boolean(props.label)
    return {
      class: indeterminate.value ? 'bl-meter bl-meter--indeterminate' : 'bl-meter',
      role,
      'aria-label': labelled ? undefined : props.ariaLabel,
      'aria-labelledby': labelled ? labelId : undefined,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuenow': indeterminate.value ? undefined : Math.round(fraction.value * 100),
      'aria-valuetext': indeterminate.value ? undefined : props.valueText,
      ...rest
    }
  }
  watch(
    () => [props.label, props.ariaLabel, attrs['aria-labelledby']],
    ([label, ariaLabel, labelledby]) => {
      if (!label && ariaLabel === undefined && labelledby === undefined)
        warn(`${component}: set \`label\` (visible) or \`ariaLabel\` (\`aria-label\`) to name it.`)
    },
    { immediate: true }
  )
  return { attrs, labelId, indeterminate, fraction, visibleValue, wrapped, barAttrs }
}
