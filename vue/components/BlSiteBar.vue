<template>
  <header class="bl-site-bar" :data-lifted="lifted ? '' : undefined">
    <div class="bl-col bl-site-bar__inner">
      <slot name="brand" />
      <nav v-if="$slots.nav" class="bl-site-bar__navwrap" :aria-label="navLabel">
        <ul class="bl-site-bar__nav">
          <slot name="nav" />
        </ul>
      </nav>
      <div v-if="$slots.actions" class="bl-site-bar__actions">
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
