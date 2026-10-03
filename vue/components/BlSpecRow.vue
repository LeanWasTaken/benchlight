<template>
  <div class="bl-spec-row">
    <dt class="bl-spec-row__label">{{ label }}</dt>
    <dd class="bl-spec-row__value">
      <slot>
        <a
          v-if="href"
          :href="href"
          :target="external ? '_blank' : undefined"
          :rel="external ? 'noopener noreferrer' : undefined"
          >{{ value }}</a
        >
        <template v-else>{{ value }}</template>
      </slot>
    </dd>
  </div>
</template>

<script setup lang="ts">
  withDefaults(
    defineProps<{ label: string; value?: string; href?: string; external?: boolean }>(),
    { external: true }
  )
</script>
