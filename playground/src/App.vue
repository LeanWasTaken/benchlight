<template>
  <KdSkipLink />
  <KdSiteBar>
    <template #brand>
      <a class="kd-site-bar__brand" href="#top">KDESIGN</a>
    </template>
    <template #nav>
      <KdNavLink href="#tokens" current>Tokens</KdNavLink>
      <KdNavLink href="#controls">Controls</KdNavLink>
      <KdNavLink href="#readouts">Readouts</KdNavLink>
      <KdNavLink href="#lists">Lists</KdNavLink>
    </template>
    <template #actions>
      <KdAppearanceSwitch />
    </template>
  </KdSiteBar>

  <main id="main-content" tabindex="-1" class="kd-col pg-main">
    <section id="top">
      <KdMeta class="kd-rise" :items="['kdesign', 'Benchlight', 'v0.1.0']" separator />
      <h1 class="kd-display kd-display--xl kd-rise" :style="riseDelay(1)">Benchlight</h1>
      <p class="kd-lede kd-rise" :style="riseDelay(2)">
        One bench-lit identity for every personal project: generated tokens, plain CSS in cascade
        layers, and thin Vue components on top.
      </p>
      <KdTelemetry class="pg-block kd-rise" :style="riseDelay(3)" columns="1.4fr 1fr 1fr">
        <KdTelemetryCell label="Now playing">
          <KdEqBars active />
          <KdMarquee
            class="pg-marquee"
            title="Track title · Artist name · Album name long enough to scroll"
          >
            <span>Track title</span>
            <span class="pg-dim">·</span>
            <span>Artist name · Album name long enough to scroll</span>
          </KdMarquee>
        </KdTelemetryCell>
        <KdTelemetryCell label="Local time">UTC 21:04</KdTelemetryCell>
        <KdTelemetryCell label="Status"><KdLed state="on" /> Available</KdTelemetryCell>
      </KdTelemetry>
    </section>

    <section id="tokens">
      <KdSectionHead eyebrow="Tokens" heading="Colour" ruled />
      <div class="pg-swatches">
        <div v-for="name in colorNames" :key="name" class="pg-swatch">
          <span class="pg-chip" :style="{ background: `var(--kd-${name})` }" />
          <span class="kd-annotation">--kd-{{ name }}</span>
        </div>
      </div>
      <div class="pg-row">
        <span class="kd-silkscreen">Silkscreen</span>
        <span class="kd-annotation">Annotation 2026-10-03</span>
        <span class="kd-display kd-display--md">Display</span>
      </div>
    </section>

    <section id="controls">
      <KdSectionHead eyebrow="Controls" heading="Buttons, segments, fields" ruled />
      <div class="pg-row">
        <KdButton>Primary</KdButton>
        <KdButton variant="secondary">Secondary</KdButton>
        <KdButton variant="danger">Erase flash</KdButton>
        <KdButton variant="secondary" pill>← Back home</KdButton>
        <KdButton disabled>Disabled</KdButton>
      </div>
      <div class="pg-row">
        <KdSegmented v-model="filter" :options="filters" label="Category" />
        <KdSegmented as="a" compact :options="locales" label="Language" />
      </div>
      <div class="pg-stack">
        <KdField v-slot="{ id }" label="Display name" hint="Shown next to your avatar.">
          <KdInput :id="id" v-model="displayName" />
        </KdField>
        <KdField v-slot="{ id }" label="Network">
          <KdSelect :id="id" v-model="network" :options="networks" />
        </KdField>
        <KdField v-slot="{ id }" label="Volume">
          <KdRange :id="id" v-model="volume" :min="-60" :max="0" :format="(v) => `${v} dB`" />
        </KdField>
      </div>
      <div class="pg-row">
        <KdLinkArrow href="#lists">All projects</KdLinkArrow>
        <KdLinkArrow href="#top" direction="left" quiet>Back</KdLinkArrow>
        <KdLinkArrow href="mailto:hello@example.com" direction="up-right">Contact</KdLinkArrow>
      </div>
    </section>

    <section id="readouts">
      <KdSectionHead eyebrow="Readouts" heading="Panels, meters, messages" ruled />
      <div class="pg-stack">
        <KdSpecPanel :rows="specRows" />
        <div>
          <KdReadout value="94.2" unit="Mbps" />
          <KdMeter :value="0.62" label="Download" />
        </div>
        <div>
          <KdMsg tone="ok">Saved. Rebooting in 3 s.</KdMsg>
          <KdMsg tone="err">Upload failed: image too large.</KdMsg>
          <KdMsg tone="info">Scanning for networks…</KdMsg>
        </div>
        <div class="pg-row">
          <KdLed state="on" /><span class="kd-annotation">on</span> <KdLed /><span
            class="kd-annotation"
            >off</span
          >
          <KdLed state="danger" /><span class="kd-annotation">danger</span>
        </div>
        <KdLog :lines="logLines" />
      </div>
    </section>

    <section id="lists">
      <KdSectionHead eyebrow="Featured projects" bar>
        <template #action><KdLinkArrow href="#lists">All projects</KdLinkArrow></template>
      </KdSectionHead>
      <KdIndex>
        <KdIndexRow v-for="project in projects" :key="project.refdes" href="#lists">
          <template #meta>
            <KdMeta as="span" :items="project.meta" />
          </template>
          <template #title>{{ project.title }}</template>
          {{ project.description }}
        </KdIndexRow>
      </KdIndex>

      <KdSectionHead class="pg-block" eyebrow="Timeline" heading="Journey" />
      <KdIndex ruled-top>
        <KdIndexRow v-for="entry in timeline" :key="entry.year" compact>
          <template #meta>
            <KdMeta
              as="span"
              :items="[{ text: entry.year, class: 'kd-meta__key' }, entry.meta]"
              separator
            />
          </template>
          <template #title>{{ entry.title }}</template>
          {{ entry.desc }}
        </KdIndexRow>
      </KdIndex>

      <KdSectionHead class="pg-block" eyebrow="Off the clock" heading="Other things I'm into" />
      <KdIndex ruled-top grid>
        <KdIndexRow v-for="interest in interests" :key="interest.title" compact>
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9" />
            </svg>
          </template>
          <template #title>{{ interest.title }}</template>
          {{ interest.desc }}
        </KdIndexRow>
      </KdIndex>

      <KdPrevNext
        :prev="{ title: 'Project Two', href: '#lists' }"
        :next="{ title: 'Project Three', href: '#lists' }"
      />

      <KdProse class="pg-block">
        <h2>Why I built it</h2>
        <p>
          Existing tools are expensive, platform-locked, or both. This one runs in the browser and
          talks to a <a href="#lists">common USB adapter</a>.
        </p>
        <h3>How it works</h3>
        <ul>
          <li>Decode pipeline with schema support</li>
          <li>Scripting sandbox for replay and testing</li>
        </ul>
        <p>Polling runs every <code>500</code> ms:</p>
        <pre><code>const value = parse(input)</code></pre>
        <blockquote>Fix things that, probably, weren't broken.</blockquote>
      </KdProse>
    </section>
  </main>

  <KdColophon :items="['© 2026 Example', 'Remote', 'Rev 0.1.0']" />
  <KdTabBar label="Playground">
    <KdTabBarItem href="#tokens" current>
      <template #icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      </template>
      Tokens
    </KdTabBarItem>
    <KdTabBarItem href="#controls">
      <template #icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7h16M4 17h16" />
        </svg>
      </template>
      Controls
    </KdTabBarItem>
    <KdTabBarItem href="#lists">
      <template #icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 6h12M8 12h12M8 18h12M4 6h0M4 12h0M4 18h0" />
        </svg>
      </template>
      Lists
    </KdTabBarItem>
  </KdTabBar>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { colorNames } from '../../tokens/tokens'
  import {
    KdAppearanceSwitch,
    KdButton,
    KdColophon,
    KdEqBars,
    KdField,
    KdIndex,
    KdIndexRow,
    KdInput,
    KdLed,
    KdLinkArrow,
    KdLog,
    KdMarquee,
    KdMeta,
    KdMeter,
    KdMsg,
    KdNavLink,
    KdPrevNext,
    KdProse,
    KdRange,
    KdReadout,
    KdSectionHead,
    KdSegmented,
    KdSelect,
    KdSiteBar,
    KdSkipLink,
    KdSpecPanel,
    KdTabBar,
    KdTabBarItem,
    KdTelemetry,
    KdTelemetryCell,
    riseDelay
  } from '../../vue'

  const filter = ref<string | null>(null)
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

  const displayName = ref('Your name')
  const network = ref('home')
  const networks = [
    { value: 'home', label: 'home-5g · -48 dBm' },
    { value: 'guest', label: 'guest · -71 dBm' }
  ]
  const volume = ref(-12)

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

  const logLines = [
    '\x1b[0;32mI (1203) wifi: connected to home-5g, rssi -48\x1b[0m',
    '\x1b[0;33mW (1490) sync: clock skew 3 ms\x1b[0m',
    '\x1b[0;31mE (2011) ota: image too large\x1b[0m',
    'I (2100) main: idle'
  ]

  const projects = [
    {
      refdes: 'SW-01',
      title: 'Project One',
      description: 'A browser tool for inspecting live data streams.',
      meta: [{ text: 'SW-01', class: 'kd-meta__key' }, 'Software', '2026', 'Active']
    },
    {
      refdes: 'HW-01',
      title: 'Project Two',
      description: 'A small board that logs power readings over USB.',
      meta: [{ text: 'HW-01', class: 'kd-meta__key' }, 'Hardware', '2025', 'Shipped']
    }
  ]

  const timeline = [
    { year: '2025', meta: 'Now', title: 'Personal projects', desc: 'Wherever curiosity points.' },
    {
      year: '2023',
      meta: 'Remote',
      title: 'Web developer',
      desc: 'Production apps in TypeScript and Vue.'
    }
  ]

  const interests = [
    { title: 'Hardware', desc: 'Custom PCBs, firmware, the odd reverse-engineering session.' },
    { title: 'Music', desc: 'Always something playing.' }
  ]
</script>
