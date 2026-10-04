<template>
  <div class="bl-spec-row">
    <dt class="bl-spec-row__label">{{ label }}</dt>
    <dd class="bl-spec-row__value">
      <slot>
        <a
          v-if="href"
          :href="href"
          :target="isExternal ? '_blank' : undefined"
          :rel="isExternal ? 'noopener noreferrer' : undefined"
          >{{ value }}</a
        >
        <template v-else>{{ value }}</template>
      </slot>
    </dd>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{ label: string; value?: string; href?: string; external?: boolean | null }>(),
    { external: null }
  )
  const isExternal = computed(() => props.external ?? /^(https?:)?\/\//.test(props.href ?? ''))
</script>
