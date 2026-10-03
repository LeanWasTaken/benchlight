<template>
  <div
    class="bl-segmented"
    :class="{ 'bl-segmented--compact': compact }"
    :role="as ? undefined : 'group'"
    :aria-label="label"
  >
    <template v-if="as">
      <component
        :is="as"
        v-for="option in options"
        :key="String(option.value)"
        v-bind="linkBindings(as, option.to, option.href)"
        class="bl-segmented__item"
        :aria-current="option.current ? 'true' : undefined"
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
  </div>
</template>

<script setup lang="ts" generic="T extends string | number | null">
  import { linkBindings } from '../internal/link'
  import type { LinkAs, SegmentedOption } from '../types'

  defineProps<{
    options: SegmentedOption<T>[]
    modelValue?: T
    as?: LinkAs
    compact?: boolean
    label?: string
  }>()
  const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
</script>
