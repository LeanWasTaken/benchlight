<template>
  <main class="kd-col">
    <h1 class="kd-display kd-display--lg">kdesign vite fixture</h1>
    <KdAppearanceSwitch />
    <KdButton variant="secondary">Back</KdButton>
    <KdLed state="on" />
  </main>
</template>

<script setup lang="ts">
  import { KdAppearanceSwitch, KdButton, KdLed } from 'kdesign/vue'
</script>
