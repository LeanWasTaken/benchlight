<template>
  <div class="bl-spec-row">
    <dt class="bl-spec-row__label">{{ label }}</dt>
    <dd class="bl-spec-row__value">
      <slot>
        <component
          :is="tag"
          v-if="linked"
          v-bind="linkBindings(tag, to, href)"
          :target="isExternal ? '_blank' : undefined"
          :rel="isExternal ? 'noopener noreferrer' : undefined"
          >{{ value }}</component
        >
        <template v-else>{{ value }}</template>
      </slot>
    </dd>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { linkBindings, resolveTag } from '../internal/link'
  import type { LinkAs, LinkTo } from '../types'

  const props = withDefaults(
    defineProps<{
      label: string
      value?: string
      as?: LinkAs
      to?: LinkTo
      href?: string
      external?: boolean | null
    }>(),
    { external: null }
  )
  const linked = computed(() => !!(props.as || props.to !== undefined || props.href))
  const tag = computed(() => resolveTag(props.as, props.to, props.href, 'a'))
  const isExternal = computed(() => props.external ?? /^(https?:)?\/\//.test(props.href ?? ''))
</script>
