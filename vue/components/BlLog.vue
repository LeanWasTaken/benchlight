<template>
  <pre
    ref="element"
    class="bl-log"
    role="log"
    aria-live="polite"
  ><template v-for="(segments, row) in parsed" :key="row"><span v-for="(segment, index) in segments" :key="index" :class="segment.className">{{ segment.text }}</span>{{ row < parsed.length - 1 ? '\n' : '' }}</template></pre>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import { ansiToSegments } from '../utils/ansi'

  const props = withDefaults(defineProps<{ lines: string[]; follow?: boolean }>(), {
    follow: true
  })
  const element = ref<HTMLElement | null>(null)
  const parsed = computed(() => props.lines.map(ansiToSegments))

  watch([() => props.lines, () => props.lines.length], async () => {
    if (!props.follow) return
    await nextTick()
    if (element.value) element.value.scrollTop = element.value.scrollHeight
  })
</script>
