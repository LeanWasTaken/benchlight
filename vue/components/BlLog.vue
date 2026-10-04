<template>
  <pre
    ref="element"
    class="bl-log"
    role="log"
    tabindex="0"
    :aria-label="label"
  ><template v-for="(segments, row) in parsed" :key="offset + row"><span v-for="(segment, index) in segments" :key="index" v-bind="segment.className ? { class: segment.className } : {}">{{ segment.text }}</span>{{ row < parsed.length - 1 ? '\n' : '' }}</template></pre>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import { useFollowScroll } from '../composables/useFollowScroll'
  import { ansiToSegments } from '../utils/ansi'

  // CSS: text is in rem; the default max height is 12.5rem, set `--bl-log-height` to change it.
  const props = withDefaults(
    defineProps<{
      lines: string[]
      follow?: boolean
      label?: string
      /**
       * Absolute index of `lines[0]`, default 0. When a capped buffer drops its oldest line,
       * advance this by one so surviving rows keep their DOM nodes instead of every row being
       * re-patched (which makes screen readers re-announce the log).
       */
      offset?: number
    }>(),
    { follow: true, label: 'Log', offset: 0 }
  )
  const element = ref<HTMLElement | null>(null)
  const parsed = computed(() => props.lines.map(ansiToSegments))
  const { toBottom } = useFollowScroll(element, { enabled: () => props.follow })

  watch([() => props.lines, () => props.lines.length], async () => {
    await nextTick()
    toBottom()
  })
</script>
