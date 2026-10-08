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
    <BlButton label="Copy">
      <template #icon>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="5" y="5" width="8" height="8" rx="1" />
          <path d="M3 11V3h8" />
        </svg>
      </template>
    </BlButton>
    <BlButton variant="secondary" label="Close">
      <template #icon>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 3l10 10M13 3L3 13" />
        </svg>
      </template>
    </BlButton>
    <BlButton variant="ghost" label="Settings">
      <template #icon>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
      </template>
    </BlButton>
    <BlButton variant="secondary" pill label="Next">
      <template #icon>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 3l5 5-5 5" />
        </svg>
      </template>
    </BlButton>
    <BlButton variant="secondary" label="Mute" :pressed="muted" @click="muted = !muted">
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
    <BlSegmented v-model="filter" :options="filters" label="Category" />
    <BlSegmented as="a" compact :options="locales" label="Language" />
  </div>
  <div class="pg-row">
    <div class="bl-segmented" role="radiogroup" aria-label="Size">
      <label v-for="size in ['S', 'M', 'L']" :key="size" class="bl-segmented__item">
        <input v-model="sizeChoice" type="radio" name="size" :value="size" />
        {{ size }}
      </label>
    </div>
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
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { BlButton, BlLinkArrow, BlSectionHead, BlSegmented } from '../../../vue'

  const muted = ref(false)
  const bold = ref(false)
  const ghostOn = ref(false)
  const filter = ref<string | null>(null)
  const sizeChoice = ref('M')
  const filters = [
    { value: null, label: 'All' },
    { value: 'software', label: 'Software' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'experiment', label: 'Experiments' }
  ]
  const locales = [
    { value: 'en', label: 'en', href: '#top', current: true },
    { value: 'lv', label: 'lv', href: '#top' }
  ]
</script>
