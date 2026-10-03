<template>
  <div class="kd-spec-row">
    <dt class="kd-spec-row__label">{{ label }}</dt>
    <dd class="kd-spec-row__value">
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
