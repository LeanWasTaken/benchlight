<template>
  <BlSectionHead :level="3" eyebrow="Button" heading="Variants and states" />
  <div class="pg-row">
    <BlButton>Primary</BlButton>
    <BlButton variant="secondary">Secondary</BlButton>
    <BlButton variant="danger">Erase flash</BlButton>
    <BlButton variant="ghost">Ghost</BlButton>
    <BlButton variant="secondary" pill>← Back home</BlButton>
    <BlButton disabled>Disabled</BlButton>
    <BlButton href="/x" disabled variant="secondary">Unavailable</BlButton>
    <BlButton as="a" href="#controls" variant="secondary">As a link</BlButton>
  </div>
  <div class="pg-row">
    <BlButton aria-label="Copy">
      <template #icon>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="5" y="5" width="8" height="8" rx="1" />
          <path d="M3 11V3h8" />
        </svg>
      </template>
    </BlButton>
    <BlButton variant="secondary" aria-label="Close">
      <template #icon>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 3l10 10M13 3L3 13" />
        </svg>
      </template>
    </BlButton>
    <BlButton variant="ghost" aria-label="Settings">
      <template #icon>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
      </template>
    </BlButton>
    <BlButton variant="secondary" pill aria-label="Next">
      <template #icon>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 3l5 5-5 5" />
        </svg>
      </template>
    </BlButton>
    <BlButton variant="secondary" aria-label="Mute" :pressed="muted" @click="muted = !muted">
      <template #icon>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 6h3l4-3v10l-4-3H2z" />
        </svg>
      </template>
    </BlButton>
  </div>
  <div class="pg-row">
    <BlButton :pressed="bold" @click="bold = !bold">Bold</BlButton>
    <BlButton pressed>Pressed</BlButton>
    <BlButton variant="secondary" pressed>Pressed secondary</BlButton>
    <BlButton variant="danger" pressed>Alarm on</BlButton>
    <BlButton variant="ghost" :pressed="ghostOn" @click="ghostOn = !ghostOn">Ghost toggle</BlButton>
  </div>

  <BlSectionHead :level="3" eyebrow="Segmented" heading="Buttons, links and radios" />
  <div class="pg-row">
    <BlSegmented v-model="filter" :options="filters" aria-label="Category" />
    <BlSegmentedNav compact :items="locales" aria-label="Language" />
  </div>
  <div class="pg-row">
    <BlSegmented v-model="sizeChoice" :options="sizes" aria-label="Size" name="size" />
  </div>

  <BlSectionHead :level="3" eyebrow="Links" heading="Arrows">
    <template #actions><BlLinkArrow href="#content">All projects</BlLinkArrow></template>
  </BlSectionHead>
  <div class="pg-row">
    <BlLinkArrow href="#content">All projects</BlLinkArrow>
    <BlLinkArrow href="#top" direction="left" quiet>Back</BlLinkArrow>
    <BlLinkArrow href="mailto:hello@example.com" direction="up-right">Contact</BlLinkArrow>
    <BlLinkArrow href="#content">
      Custom icon
      <template #icon><span aria-hidden="true">+</span></template>
    </BlLinkArrow>
  </div>
  <BlSectionHead :level="3" eyebrow="Popover" heading="Anchored panels" />
  <div class="pg-row" data-demo="popover">
    <BlPopover v-model:open="detailsOpen">
      <template #trigger="{ bind }">
        <BlButton variant="secondary" v-bind="bind">Details</BlButton>
      </template>
      Firmware 2.4.1, built from a clean tree.
    </BlPopover>
    <BlPopover align="start" aria-label="Filters">
      <template #trigger="{ bind }">
        <BlButton variant="secondary" v-bind="bind">Filters</BlButton>
      </template>
      <BlTooltip text="Shows every item again.">
        <template #trigger="{ bind }">
          <BlButton variant="ghost" v-bind="bind">Clear filters</BlButton>
        </template>
      </BlTooltip>
    </BlPopover>
  </div>
  <BlSectionHead :level="3" eyebrow="Tooltip" heading="Described controls" />
  <div class="pg-row" data-demo="tooltip">
    <BlTooltip text="Copies the build hash to the clipboard.">
      <template #trigger="{ bind }">
        <BlButton variant="secondary" v-bind="bind">Copy hash</BlButton>
      </template>
    </BlTooltip>
    <BlTooltip text="Runs on the next boot." side="bottom" align="start">
      <template #trigger="{ bind }">
        <BlButton variant="secondary" v-bind="bind">Schedule</BlButton>
      </template>
    </BlTooltip>
  </div>
  <BlSectionHead :level="3" eyebrow="Tabs" heading="Switching panels" />
  <div data-demo="tabs">
    <BlTabs v-model="tab" :items="tabItems" aria-label="Device">
      <template #panel-status>
        <p>Uptime 14 d, firmware 2.4.1, last sync 09:12.</p>
      </template>
      <template #[bootLogSlot]>
        <BlButton variant="secondary">Download log</BlButton>
      </template>
      <template #panel-radio>
        <p>The radio is off.</p>
      </template>
      <template #panel-settings>
        <p>Wi-Fi channel 36, 80 MHz.</p>
      </template>
    </BlTabs>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import type { SegmentedOption, TabItem } from '../../../vue'
  import {
    BlButton,
    BlLinkArrow,
    BlPopover,
    BlSectionHead,
    BlSegmented,
    BlSegmentedNav,
    BlTabs,
    BlTooltip
  } from '../../../vue'

  const muted = ref(false)
  const bold = ref(false)
  const ghostOn = ref(false)
  const detailsOpen = ref(false)
  const filter = ref<string | null>(null)
  const sizeChoice = ref('M')
  const sizes = ['S', 'M', 'L'].map((size) => ({ value: size, label: size }))
  const filters: SegmentedOption<string | null>[] = [
    { value: null, label: 'All' },
    { value: 'software', label: 'Software' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'experiment', label: 'Experiments' }
  ]
  const tab = ref('status')
  // A value with a space: its slot name needs the dynamic form.
  const bootLogSlot = 'panel-boot log'
  const tabItems: TabItem<string>[] = [
    { value: 'status', label: 'Status' },
    { value: 'boot log', label: 'Boot log' },
    { value: 'radio', label: 'Radio', disabled: true },
    { value: 'settings', label: 'Settings' }
  ]
  const locales = [
    { value: 'en', label: 'en', href: '#top', current: true },
    { value: 'lv', label: 'lv', href: '#top' }
  ]
</script>
