<template>
  <header class="bl-site-bar" :data-lifted="lifted ? '' : undefined">
    <div class="bl-col bl-site-bar__inner">
      <slot name="brand" />
      <nav
        v-if="$slots['nav']"
        class="bl-site-bar__navwrap"
        :aria-label="navLabel"
        @focusin="revealFocused"
      >
        <ul class="bl-site-bar__nav">
          <slot name="nav" />
        </ul>
      </nav>
      <div v-if="$slots['actions']" class="bl-site-bar__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
  import { useScrollLifted } from '../composables/useScrollLifted'

  const props = withDefaults(defineProps<{ lift?: number | false; navLabel?: string }>(), {
    lift: 24,
    navLabel: 'Primary'
  })
  const lifted = useScrollLifted(() => props.lift)

  // The nav is a masked scroller; the browser only scrolls a focused link into view once its
  // centre is hidden, which can leave it partly under the edge fade. Adjust only the scroller:
  // scrollIntoView would also move the window (sticky bar plus scroll-padding-block).
  const FADE_CLEARANCE = 16
  function revealFocused(event: FocusEvent): void {
    const nav = event.currentTarget
    const target = event.target
    if (!(nav instanceof HTMLElement) || !(target instanceof Element)) return
    if (nav.scrollWidth <= nav.clientWidth) return
    const box = nav.getBoundingClientRect()
    const link = target.getBoundingClientRect()
    const overLeft = box.left + FADE_CLEARANCE - link.left
    const overRight = link.right - (box.right - FADE_CLEARANCE)
    let delta = 0
    if (overLeft > 0) delta = -overLeft
    else if (overRight > 0) delta = Math.min(overRight, link.left - (box.left + FADE_CLEARANCE))
    if (delta) nav.scrollTo({ left: nav.scrollLeft + delta, behavior: 'auto' })
  }
</script>
