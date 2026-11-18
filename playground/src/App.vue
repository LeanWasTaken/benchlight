<template>
  <BlSkipLink />
  <BlSiteBar aria-label="Playground sections">
    <template #brand>
      <a class="bl-site-bar__brand" href="#top">BENCHLIGHT</a>
    </template>
    <template #nav>
      <BlSiteBarLink
        v-for="s in sections"
        :key="s.id"
        :href="`#${s.id}`"
        :current="active === s.id"
      >
        {{ s.nav }}
      </BlSiteBarLink>
    </template>
    <template #actions>
      <BlAppearanceSwitch />
    </template>
  </BlSiteBar>

  <main id="main-content" tabindex="-1" class="bl-col pg-main">
    <section id="top">
      <BlMeta class="bl-rise" :items="['Benchlight', 'design system', `v${version}`]" separator />
      <h1 class="bl-display bl-display--xl bl-rise" :style="riseDelay(1)">Benchlight</h1>
      <p class="bl-lede bl-rise" :style="riseDelay(2)">
        One bench-lit identity for every personal project: generated tokens, plain CSS in cascade
        layers, and thin Vue components on top.
      </p>
      <BlTelemetry class="bl-rise" :style="riseDelay(3)" columns="1.4fr 1fr 1fr">
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
        <BlTelemetryCell label="Status"><BlLed tone="success" /> Available</BlTelemetryCell>
      </BlTelemetry>
    </section>

    <section id="tokens">
      <BlSectionHead eyebrow="Tokens" heading="Colour, tints and type" ruled />
      <DemoTokens />
    </section>

    <section id="controls">
      <BlSectionHead eyebrow="Controls" heading="Buttons, segments, links" ruled />
      <DemoControls />
    </section>

    <section id="forms">
      <BlSectionHead eyebrow="Forms" heading="Fields, ranges, switches" ruled />
      <DemoForms v-model:wifi="wifi" />
    </section>

    <section id="readouts">
      <BlSectionHead eyebrow="Readouts" heading="Panels, meters, messages" ruled />
      <DemoReadouts />
    </section>

    <section id="content">
      <BlSectionHead eyebrow="Content" heading="Lists, media, prose" ruled />
      <DemoContent />
    </section>

    <section id="tables">
      <BlSectionHead eyebrow="Tables" heading="Connected clients" ruled />
      <DemoTables :narrow-rows="clients.slice(0, 4)" />
    </section>

    <section id="blocks">
      <BlSectionHead
        eyebrow="Building blocks"
        heading="Disclosure, dialog, lightbox, toast"
        ruled
      />
      <DemoBlocks />
    </section>

    <section id="hooks">
      <BlSectionHead eyebrow="Composables" heading="Hooks and helpers" ruled />
      <DemoHooks />
    </section>
  </main>

  <BlColophon :items="['© 2026 Example', 'Remote', `Rev ${version}`]">
    <template #actions
      ><BlLinkArrow href="#top" direction="up-right" quiet>Top</BlLinkArrow></template
    >
  </BlColophon>
  <BlTabBar aria-label="Playground">
    <BlTabBarItem
      v-for="item in tabs"
      :key="item.id"
      :href="`#${item.id}`"
      :current="active === item.id"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path :d="item.icon" />
        </svg>
      </template>
      {{ item.label }}
    </BlTabBarItem>
  </BlTabBar>
  <BlToaster />
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import pkg from '../../package.json'
  import {
    BlAppearanceSwitch,
    BlColophon,
    BlEqBars,
    BlLed,
    BlLinkArrow,
    BlMarquee,
    BlMeta,
    BlSiteBarLink,
    BlSectionHead,
    BlSiteBar,
    BlSkipLink,
    BlTabBar,
    BlTabBarItem,
    BlTelemetry,
    BlTelemetryCell,
    BlToaster,
    riseDelay,
    useActiveSection
  } from '../../vue'
  import DemoBlocks from './demos/DemoBlocks.vue'
  import DemoContent from './demos/DemoContent.vue'
  import DemoControls from './demos/DemoControls.vue'
  import DemoForms from './demos/DemoForms.vue'
  import DemoHooks from './demos/DemoHooks.vue'
  import DemoReadouts from './demos/DemoReadouts.vue'
  import DemoTables from './demos/DemoTables.vue'
  import DemoTokens from './demos/DemoTokens.vue'
  import { clients } from './demos/data'

  const version = pkg.version
  const wifi = ref(true)

  const sections = [
    { id: 'tokens', nav: 'Tokens' },
    { id: 'controls', nav: 'Controls' },
    { id: 'forms', nav: 'Forms' },
    { id: 'readouts', nav: 'Readouts' },
    { id: 'content', nav: 'Content' },
    { id: 'tables', nav: 'Tables' },
    { id: 'blocks', nav: 'Blocks' },
    { id: 'hooks', nav: 'Hooks' }
  ]
  // the sticky site bar is 56px; the tab bar's sections are a subset of the nav's
  const { active } = useActiveSection(
    sections.map((s) => s.id),
    { offset: 56 }
  )
  const tabs = [
    { id: 'tokens', label: 'Tokens', icon: 'M4 4h16v16H4z' },
    { id: 'controls', label: 'Controls', icon: 'M4 7h16M4 17h16' },
    { id: 'tables', label: 'Tables', icon: 'M4 6h16M4 12h16M4 18h16' },
    { id: 'blocks', label: 'Blocks', icon: 'M5 5h6v6H5zM13 13h6v6h-6z' }
  ]
</script>
