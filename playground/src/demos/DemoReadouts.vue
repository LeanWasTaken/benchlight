<template>
  <BlSectionHead :level="3" eyebrow="Spec panel" heading="Rows and slots" />
  <div class="pg-stack">
    <BlSpecPanel :rows="specRows" />
    <BlSpecPanel>
      <BlSpecRow label="Owner" value="Example" />
      <BlSpecRow label="Mirror" value="mirror.example.org" href="//mirror.example.org" />
      <BlSpecRow label="Docs" value="Same tab" href="#readouts" :external="false" />
      <BlSpecRow label="Build"><span class="bl-annotation">rev a1b2c3</span></BlSpecRow>
    </BlSpecPanel>
  </div>

  <BlSectionHead :level="3" eyebrow="Readout and meter" heading="Numbers and bars" />
  <div class="pg-stack">
    <BlReadout value="94.2" unit="Mbps" />
    <BlReadout :value="12" />
    <BlMeter :value="0.62" aria-label="Download" />
    <BlProgress :value="0.4" aria-label="Uploading" />
    <BlProgress :value="null" aria-label="Scanning" />
    <BlProgress :value="null" label="Indexing" show-value />
    <BlMeter :value="0.52" label="Storage" show-value />
    <BlMeter :value="0.52" label="Memory" value-text="2.1 of 4 GB" show-value />
  </div>

  <BlSectionHead :level="3" eyebrow="Status" heading="Messages, LEDs, bars" />
  <div class="pg-stack">
    <BlMsg tone="success">Saved. Rebooting in 3 s.</BlMsg>
    <BlMsg tone="danger">Upload failed: image too large.</BlMsg>
    <BlMsg tone="neutral">Scanning for networks…</BlMsg>
    <BlMsg>Default tone is neutral.</BlMsg>
  </div>
  <div class="pg-row">
    <BlLed state="on" /><span class="bl-annotation">on</span> <BlLed />
    <span class="bl-annotation">off</span>
    <BlLed state="danger" /><span class="bl-annotation">danger</span> <BlEqBars active /><span
      class="bl-annotation"
      >active</span
    >
    <BlEqBars /><span class="bl-annotation">idle</span>
  </div>

  <BlSectionHead :level="3" eyebrow="Telemetry" heading="Cells and columns" />
  <BlTelemetry>
    <BlTelemetryCell label="Uplink">94.2 Mbps</BlTelemetryCell>
    <BlTelemetryCell label="Clients">12</BlTelemetryCell>
    <BlTelemetryCell label="Channel">6</BlTelemetryCell>
  </BlTelemetry>
  <BlTelemetry columns="1fr 2fr">
    <BlTelemetryCell label="Short">Fits</BlTelemetryCell>
    <BlTelemetryCell label="Custom columns">1fr 2fr</BlTelemetryCell>
  </BlTelemetry>

  <BlSectionHead :level="3" eyebrow="Log" heading="Follows only while pinned" />
  <div class="pg-stack">
    <BlLog :lines="lines" :follow="follow" :offset="offset" aria-label="Device log" />
    <div class="pg-row">
      <BlButton variant="secondary" @click="appendLogLine">Append line</BlButton>
      <BlToggle v-model="follow" label="Follow output" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import {
    BlButton,
    BlEqBars,
    BlLed,
    BlLog,
    BlMeter,
    BlProgress,
    BlMsg,
    BlReadout,
    BlSectionHead,
    BlSpecPanel,
    BlSpecRow,
    BlTelemetry,
    BlTelemetryCell,
    BlToggle
  } from '../../../vue'
  import { logLines } from './data'

  const MAX_LINES = 60
  const lines = ref([...logLines])
  const offset = ref(0)
  const follow = ref(true)

  // A capped buffer: when the oldest line drops, advance `offset` so the rest keep their nodes.
  function appendLogLine(): void {
    lines.value.push(`I (${3000 + (offset.value + lines.value.length) * 40}) main: appended`)
    if (lines.value.length > MAX_LINES) {
      lines.value.shift()
      offset.value += 1
    }
  }

  const specRows = [
    { label: 'Refdes', value: 'SW-01' },
    { label: 'Category', value: 'Software' },
    { label: 'Status', value: 'Active' },
    { label: 'Stack', value: 'TypeScript · Rust · WebUSB' },
    {
      label: 'Source',
      value: 'github.com/example/project-one',
      href: 'https://github.com/example/project-one'
    }
  ]
</script>
