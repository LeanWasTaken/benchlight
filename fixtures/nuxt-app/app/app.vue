<template>
  <div>
    <BlSkipLink />
    <BlSiteBar>
      <template #brand>
        <NuxtLink to="/" class="bl-site-bar__brand">FIXTURE</NuxtLink>
      </template>
      <template #nav>
        <BlNavLink :as="NuxtLink" to="/" current>Home</BlNavLink>
      </template>
      <template #actions>
        <BlAppearanceSwitch />
      </template>
    </BlSiteBar>
    <main id="main-content" class="bl-col">
      <h1 class="bl-display bl-display--lg bl-rise" :style="riseDelay(1)">Fixture</h1>
      <p class="bg-surface text-ink-2 font-display">tailwind utilities</p>
      <BlLed state="on" />
      <BlSpecPanel :rows="[{ label: 'Refdes', value: 'SW-01' }]" />
    </main>
    <BlColophon :items="['fixture']" />
  </div>
</template>

<script setup lang="ts">
  import { NuxtLink } from '#components'
</script>
