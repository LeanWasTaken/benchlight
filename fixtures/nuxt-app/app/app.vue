<template>
  <div>
    <KdSkipLink />
    <KdSiteBar>
      <template #brand>
        <NuxtLink to="/" class="kd-site-bar__brand">FIXTURE</NuxtLink>
      </template>
      <template #nav>
        <KdNavLink :as="NuxtLink" to="/" current>Home</KdNavLink>
      </template>
      <template #actions>
        <KdAppearanceSwitch />
      </template>
    </KdSiteBar>
    <main id="main-content" class="kd-col">
      <h1 class="kd-display kd-display--lg kd-rise" :style="riseDelay(1)">Fixture</h1>
      <p class="bg-surface text-ink-2 font-display">tailwind utilities</p>
      <KdLed state="on" />
      <KdSpecPanel :rows="[{ label: 'Refdes', value: 'SW-01' }]" />
    </main>
    <KdColophon :items="['fixture']" />
  </div>
</template>

<script setup lang="ts">
  import { NuxtLink } from '#components'
</script>
