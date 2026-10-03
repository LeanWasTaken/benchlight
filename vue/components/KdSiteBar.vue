<template>
  <header class="kd-site-bar" :data-lifted="lifted ? '' : undefined">
    <div class="kd-col kd-site-bar__inner">
      <slot name="brand" />
      <nav v-if="$slots.nav" class="kd-site-bar__navwrap" :aria-label="navLabel">
        <ul class="kd-site-bar__nav">
          <slot name="nav" />
        </ul>
      </nav>
      <div v-if="$slots.actions" class="kd-site-bar__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useScrollLifted } from '../composables/useScrollLifted'

  const props = withDefaults(defineProps<{ lift?: number | false; navLabel?: string }>(), {
    lift: 24,
    navLabel: 'Primary'
  })
  const scrolled = useScrollLifted(props.lift === false ? Infinity : props.lift)
  const lifted = computed(() => props.lift !== false && scrolled.value)
</script>
