<template>
  <BlSkipLink />
  <BlSiteBar>
    <template #brand>
      <a class="bl-site-bar__brand" href="#top">BENCHLIGHT</a>
    </template>
    <template #nav>
      <BlNavLink href="#tokens" current>Tokens</BlNavLink>
      <BlNavLink href="#controls">Controls</BlNavLink>
      <BlNavLink href="#readouts">Readouts</BlNavLink>
      <BlNavLink href="#lists">Lists</BlNavLink>
    </template>
    <template #actions>
      <BlAppearanceSwitch />
    </template>
  </BlSiteBar>

  <main id="main-content" tabindex="-1" class="bl-col pg-main">
    <section id="top">
      <BlMeta class="bl-rise" :items="['Benchlight', 'design system', 'v0.2.0']" separator />
      <h1 class="bl-display bl-display--xl bl-rise" :style="riseDelay(1)">Benchlight</h1>
      <p class="bl-lede bl-rise" :style="riseDelay(2)">
        One bench-lit identity for every personal project: generated tokens, plain CSS in cascade
        layers, and thin Vue components on top.
      </p>
      <BlTelemetry class="pg-block bl-rise" :style="riseDelay(3)" columns="1.4fr 1fr 1fr">
        <BlTelemetryCell label="Now playing">
          <BlEqBars active />
          <BlMarquee
            class="pg-marquee"
            title="Track title · Artist name · Album name long enough to scroll"
          >
            <span>Track title</span>
            <span class="pg-dim">·</span>
            <span>Artist name · Album name long enough to scroll</span>
          </BlMarquee>
        </BlTelemetryCell>
        <BlTelemetryCell label="Local time">UTC 21:04</BlTelemetryCell>
        <BlTelemetryCell label="Status"><BlLed state="on" /> Available</BlTelemetryCell>
      </BlTelemetry>
    </section>

    <section id="tokens">
      <BlSectionHead eyebrow="Tokens" heading="Colour" ruled />
      <div class="pg-swatches">
        <div v-for="name in colorNames" :key="name" class="pg-swatch">
          <span class="pg-chip" :style="{ background: `var(--bl-${name})` }" />
          <span class="bl-annotation">--bl-{{ name }}</span>
        </div>
      </div>
      <div class="pg-row">
        <span class="bl-silkscreen">Silkscreen</span>
        <span class="bl-annotation">Annotation 2026-10-03</span>
        <span class="bl-display bl-display--md">Display</span>
      </div>
    </section>

    <section id="controls">
      <BlSectionHead eyebrow="Controls" heading="Buttons, segments, fields" ruled />
      <div class="pg-row">
        <BlButton>Primary</BlButton>
        <BlButton variant="secondary">Secondary</BlButton>
        <BlButton variant="danger">Erase flash</BlButton>
        <BlButton variant="secondary" pill>← Back home</BlButton>
        <BlButton disabled>Disabled</BlButton>
        <BlButton href="/x" disabled variant="secondary">Unavailable</BlButton>
      </div>
      <div class="pg-row">
        <BlSegmented v-model="filter" :options="filters" label="Category" />
        <BlSegmented as="a" compact :options="locales" label="Language" />
      </div>
      <div class="pg-stack">
        <BlField v-slot="{ id }" label="Display name" hint="Shown next to your avatar.">
          <BlInput :id="id" v-model="displayName" />
        </BlField>
        <BlField label="Auto-wired" hint="Linked via context"><BlInput /></BlField>
        <BlField v-slot="{ id }" label="Network">
          <BlSelect :id="id" v-model="network" :options="networks" />
        </BlField>
        <BlField v-slot="{ id }" label="Volume">
          <BlRange :id="id" v-model="volume" :min="-60" :max="0" :format="(v) => `${v} dB`" />
        </BlField>
      </div>
      <BlSectionHead eyebrow="Links" heading="Section with an action" ruled>
        <template #action><BlLinkArrow href="#lists">All projects</BlLinkArrow></template>
      </BlSectionHead>
      <div class="pg-row">
        <BlLinkArrow href="#lists">All projects</BlLinkArrow>
        <BlLinkArrow href="#top" direction="left" quiet>Back</BlLinkArrow>
        <BlLinkArrow href="mailto:hello@example.com" direction="up-right">Contact</BlLinkArrow>
      </div>
    </section>

    <section id="readouts">
      <BlSectionHead eyebrow="Readouts" heading="Panels, meters, messages" ruled />
      <div class="pg-stack">
        <BlSpecPanel :rows="specRows" />
        <div>
          <BlReadout value="94.2" unit="Mbps" />
          <BlMeter :value="0.62" label="Download" />
          <BlMeter :value="null" label="Scanning" />
        </div>
        <div>
          <BlMsg tone="ok">Saved. Rebooting in 3 s.</BlMsg>
          <BlMsg tone="err">Upload failed: image too large.</BlMsg>
          <BlMsg tone="info">Scanning for networks…</BlMsg>
        </div>
        <div class="pg-row">
          <BlLed state="on" /><span class="bl-annotation">on</span> <BlLed /><span
            class="bl-annotation"
            >off</span
          >
          <BlLed state="danger" /><span class="bl-annotation">danger</span>
        </div>
        <BlLog :lines="logLines" />
        <div class="pg-row">
          <BlButton variant="secondary" @click="appendLogLine">Append line</BlButton>
        </div>
      </div>
    </section>

    <section id="lists">
      <BlSectionHead eyebrow="Featured projects" bar>
        <template #action><BlLinkArrow href="#lists">All projects</BlLinkArrow></template>
      </BlSectionHead>
      <BlIndex>
        <BlIndexRow v-for="project in projects" :key="project.refdes" href="#lists">
          <template #meta>
            <BlMeta as="span" :items="project.meta" />
          </template>
          <template #title>{{ project.title }}</template>
          {{ project.description }}
        </BlIndexRow>
      </BlIndex>

      <BlSectionHead class="pg-block" eyebrow="Timeline" heading="Journey" />
      <BlIndex ruled-top>
        <BlIndexRow v-for="entry in timeline" :key="entry.year" compact>
          <template #meta>
            <BlMeta
              as="span"
              :items="[{ text: entry.year, class: 'bl-meta__key' }, entry.meta]"
              separator
            />
          </template>
          <template #title>{{ entry.title }}</template>
          {{ entry.desc }}
        </BlIndexRow>
      </BlIndex>

      <BlSectionHead class="pg-block" eyebrow="Off the clock" heading="Other things I'm into" />
      <BlIndex ruled-top grid>
        <BlIndexRow v-for="interest in interests" :key="interest.title" compact>
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9" />
            </svg>
          </template>
          <template #title>{{ interest.title }}</template>
          {{ interest.desc }}
        </BlIndexRow>
      </BlIndex>

      <BlPrevNext
        :prev="{ title: 'Project Two', href: '#lists' }"
        :next="{ title: 'Project Three', href: '#lists' }"
      />

      <BlProse class="pg-block">
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
      </BlProse>
    </section>
  </main>

  <BlColophon :items="['© 2026 Example', 'Remote', 'Rev 0.2.0']" />
  <BlTabBar label="Playground">
    <BlTabBarItem href="#tokens" current>
      <template #icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      </template>
      Tokens
    </BlTabBarItem>
    <BlTabBarItem href="#controls">
      <template #icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7h16M4 17h16" />
        </svg>
      </template>
      Controls
    </BlTabBarItem>
    <BlTabBarItem href="#lists">
      <template #icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 6h12M8 12h12M8 18h12M4 6h0M4 12h0M4 18h0" />
        </svg>
      </template>
      Lists
    </BlTabBarItem>
  </BlTabBar>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { colorNames } from '../../tokens/tokens'
  import {
    BlAppearanceSwitch,
    BlButton,
    BlColophon,
    BlEqBars,
    BlField,
    BlIndex,
    BlIndexRow,
    BlInput,
    BlLed,
    BlLinkArrow,
    BlLog,
    BlMarquee,
    BlMeta,
    BlMeter,
    BlMsg,
    BlNavLink,
    BlPrevNext,
    BlProse,
    BlRange,
    BlReadout,
    BlSectionHead,
    BlSegmented,
    BlSelect,
    BlSiteBar,
    BlSkipLink,
    BlSpecPanel,
    BlTabBar,
    BlTabBarItem,
    BlTelemetry,
    BlTelemetryCell,
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

  const logLines = ref([
    '\x1b[0;32mI (1203) wifi: connected to home-5g, rssi -48\x1b[0m',
    '\x1b[0;33mW (1490) sync: clock skew 3 ms\x1b[0m',
    '\x1b[0;31mE (2011) ota: image too large\x1b[0m',
    'I (2100) main: idle',
    ...Array.from({ length: 16 }, (_, i) => `I (${2200 + i * 40}) main: tick ${i + 1}`)
  ])

  function appendLogLine(): void {
    logLines.value.push(`I (${3000 + logLines.value.length * 40}) main: appended`)
  }

  const projects = [
    {
      refdes: 'SW-01',
      title: 'Project One',
      description: 'A browser tool for inspecting live data streams.',
      meta: [{ text: 'SW-01', class: 'bl-meta__key' }, 'Software', '2026', 'Active']
    },
    {
      refdes: 'HW-01',
      title: 'Project Two',
      description: 'A small board that logs power readings over USB.',
      meta: [{ text: 'HW-01', class: 'bl-meta__key' }, 'Hardware', '2025', 'Shipped']
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
