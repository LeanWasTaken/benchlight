<template>
  <component
    :is="linked ? 'nav' : 'div'"
    class="bl-segmented"
    :class="{ 'bl-segmented--compact': compact }"
    :role="linked ? undefined : 'group'"
    :aria-label="label"
  >
    <template v-if="linked">
      <component
        :is="tagFor(option)"
        v-for="option in options"
        :key="String(option.value)"
        v-bind="linkBindings(tagFor(option), option.to, option.href)"
        class="bl-segmented__item"
        :aria-current="option.current ? 'page' : undefined"
      >
        {{ option.label }}
      </component>
    </template>
    <template v-else>
      <button
        v-for="option in options"
        :key="String(option.value)"
        type="button"
        class="bl-segmented__item"
        :aria-pressed="option.value === modelValue"
        @click="emit('update:modelValue', option.value)"
      >
        {{ option.label }}
      </button>
    </template>
  </component>
</template>

<script setup lang="ts" generic="T extends string | number | null">
  import { computed } from 'vue'
  import { warnOnce } from '../internal/dev'
  import { linkBindings, resolveTag } from '../internal/link'
  import type { LinkAs, SegmentedOption } from '../types'

  const props = defineProps<{
    options: SegmentedOption<T>[]
    modelValue?: T
    as?: LinkAs
    compact?: boolean
    label?: string
  }>()
  const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

  // Link mode when `as` is set or any option links; `as` then only picks the tag.
  const linked = computed(
    () => !!props.as || props.options.some((o) => o.to !== undefined || o.href !== undefined)
  )
  function tagFor(option: SegmentedOption<T>): LinkAs {
    if (option.to === undefined && option.href === undefined && !props.as) {
      warnOnce('BlSegmented: an option has no to/href in link mode.')
    }
    return resolveTag(props.as, option.to, option.href, 'a')
  }
</script>
