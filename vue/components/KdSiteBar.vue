<template>
  <header class="kd-site-bar" :data-lifted="lifted ? '' : undefined">
    <div class="kd-col kd-site-bar__inner">
      <slot name="brand" />
      <ul v-if="$slots.nav" class="kd-site-bar__nav">
        <slot name="nav" />
      </ul>
      <div v-if="$slots.actions" class="kd-site-bar__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useScrollLifted } from '../composables/useScrollLifted'

  const props = withDefaults(defineProps<{ lift?: number | false }>(), { lift: 24 })
  const scrolled = useScrollLifted(props.lift === false ? Infinity : props.lift)
  const lifted = computed(() => props.lift !== false && scrolled.value)
</script>
