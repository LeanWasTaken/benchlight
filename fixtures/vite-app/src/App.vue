<template>
  <main class="bl-col">
    <h1 class="bl-display bl-display--lg">Benchlight vite fixture</h1>
    <BlAppearanceSwitch />
    <BlButton variant="secondary">Back</BlButton>
    <BlLed state="on" />
  </main>
</template>

<script setup lang="ts">
  import { BlAppearanceSwitch, BlButton, BlLed } from 'benchlight/vue'
</script>
