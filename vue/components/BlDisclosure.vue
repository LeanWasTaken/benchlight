<template>
  <details ref="el" class="bl-disclosure" :name="name" :open="open" @toggle="onToggle">
    <summary class="bl-disclosure__summary">
      <span class="bl-disclosure__title"
        ><slot name="summary">{{ summary }}</slot></span
      >
      <span class="bl-disclosure__chevron" aria-hidden="true" />
    </summary>
    <div class="bl-disclosure__body"><slot /></div>
  </details>
</template>

<script setup lang="ts">
  import { onMounted, ref, useSlots } from 'vue'
  import { warn } from '../internal/dev'

  const props = defineProps<{ summary?: string; open?: boolean; name?: string }>()
  const emit = defineEmits<{ 'update:open': [open: boolean] }>()
  const slots = useSlots()
  const el = ref<HTMLDetailsElement>()

  // Reads el.open, not event.newState (happy-dom omits it). A prop-driven change also fires
  // `toggle`; it matches the prop, so nothing is echoed back.
  function onToggle(): void {
    const open = el.value?.open ?? false
    if (open !== props.open) emit('update:open', open)
  }

  onMounted(() => {
    if (!props.summary && !slots.summary)
      warn('BlDisclosure: pass a summary prop or a summary slot.')
  })
</script>
