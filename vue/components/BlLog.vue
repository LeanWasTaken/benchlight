<template>
  <pre
    ref="element"
    class="bl-log"
    role="log"
    tabindex="0"
    :aria-label="label"
  ><template v-for="(segments, row) in parsed" :key="row"><span v-for="(segment, index) in segments" :key="index" :class="segment.className">{{ segment.text }}</span>{{ row < parsed.length - 1 ? '\n' : '' }}</template></pre>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import { useFollowScroll } from '../composables/useFollowScroll'
  import { ansiToSegments } from '../utils/ansi'

  const props = withDefaults(defineProps<{ lines: string[]; follow?: boolean; label?: string }>(), {
    follow: true,
    label: 'Log'
  })
  const element = ref<HTMLElement | null>(null)
  const parsed = computed(() => props.lines.map(ansiToSegments))
  const { toBottom } = useFollowScroll(element, { enabled: () => props.follow })

  watch([() => props.lines, () => props.lines.length], async () => {
    await nextTick()
    toBottom()
  })
</script>
