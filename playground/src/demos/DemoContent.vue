<template>
  <BlSectionHead eyebrow="Featured projects" bar>
    <template #actions><BlLinkArrow href="#content">All projects</BlLinkArrow></template>
  </BlSectionHead>
  <BlIndex>
    <BlIndexRow
      v-for="(project, index) in projects"
      :key="project.refdes"
      href="#content"
      :current="index === 0"
    >
      <template #meta>
        <BlMeta as="span" :items="project.meta" />
      </template>
      <template #title>{{ project.title }}</template>
      {{ project.description }}
    </BlIndexRow>
    <BlIndexRow to="#content">
      <template #title>Routed row</template>
      Rendered with <code>to</code> instead of <code>href</code>.
    </BlIndexRow>
    <BlIndexRow as="button">
      <template #title>Button row</template>
      Rendered as a button, for actions.
    </BlIndexRow>
    <BlIndexRow>
      <template #title>Plain row</template>
      No link at all.
    </BlIndexRow>
  </BlIndex>

  <BlSectionHead :level="3" eyebrow="Timeline" heading="Journey" />
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

  <BlSectionHead :level="3" eyebrow="Off the clock" heading="Other things I'm into" />
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

  <BlSectionHead :level="3" eyebrow="Meta" heading="Annotation lines" />
  <div class="pg-stack">
    <BlMeta :items="['Plain', 'items']" />
    <BlMeta :items="[{ text: 'KEY-01', class: 'bl-meta__key' }, 'with', 'separator']" separator />
  </div>

  <BlSectionHead :level="3" eyebrow="Media" heading="Figure, body, aside" />
  <ul class="pg-list" data-demo="media">
    <BlMedia as="li" align="center">
      <template #figure>
        <svg viewBox="0 0 64 64" role="img" aria-label="Thumbnail">
          <rect width="64" height="64" rx="6" fill="var(--bl-color-raised)" />
          <circle cx="32" cy="32" r="14" fill="var(--bl-color-trace)" />
        </svg>
      </template>
      <strong>Project title</strong>
      <BlMeta :items="['Updated 3m ago', 'Draft']" />
      <template #aside><span class="pg-mono">v2</span></template>
    </BlMedia>
    <BlMedia as="li">
      <template #figure>
        <svg viewBox="0 0 64 64" role="img" aria-label="Square thumbnail">
          <rect width="64" height="64" rx="6" fill="var(--bl-color-raised)" />
        </svg>
      </template>
      <strong>Top-aligned, with a long unbroken value</strong>
      <BlMeta :items="['0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef']" />
    </BlMedia>
    <BlMedia as="li" class="pg-media-large">
      <template #figure>
        <svg viewBox="0 0 64 64" role="img" aria-label="Large thumbnail">
          <rect width="64" height="64" rx="6" fill="var(--bl-color-raised)" />
        </svg>
      </template>
      <strong>Larger figure</strong>
      <template #aside><span class="pg-mono">--bl-media-size</span></template>
    </BlMedia>
  </ul>
  <BlMedia as="article">
    <template #figure>
      <svg viewBox="0 0 64 64" role="img" aria-label="Article thumbnail">
        <rect width="64" height="64" rx="6" fill="var(--bl-color-raised)" />
      </svg>
    </template>
    <strong>Rendered as an article</strong>
  </BlMedia>

  <BlSectionHead :level="3" eyebrow="Previous and next" heading="Sequence links" />
  <BlPrevNext
    :prev="{ title: 'Project Two', href: '#content' }"
    :next="{ title: 'Project Three', href: '#content' }"
  />
  <BlPrevNext
    :prev="{ title: 'Only a previous', href: '#content' }"
    aria-label="Chapters"
    :labels="{ prev: 'Earlier' }"
  />

  <BlSectionHead :level="3" eyebrow="Prose" heading="Long-form text" />
  <BlProse>
    <h3>Why I built it</h3>
    <p>
      Existing tools are expensive, platform-locked, or both. This one runs in the browser and talks
      to a <a href="#content">common USB adapter</a>.
    </p>
    <h4>Pipeline</h4>
    <ol>
      <li>Read frames from the adapter</li>
      <li>Decode them with the active <strong>schema</strong></li>
    </ol>
    <ul>
      <li>Decode pipeline with schema support</li>
      <li>Scripting sandbox for replay and testing</li>
    </ul>
    <p>Polling runs every <code>500</code> ms:</p>
    <pre><code>const value = parse(input)</code></pre>
    <blockquote>Fix things that, probably, weren't broken.</blockquote>
    <table>
      <caption>
        Adapter modes
      </caption>
      <thead>
        <tr>
          <th scope="col">Mode</th>
          <th scope="col">Rate</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Listen</td>
          <td>500 kbit/s</td>
        </tr>
        <tr>
          <td>Replay</td>
          <td>250 kbit/s</td>
        </tr>
      </tbody>
    </table>
  </BlProse>
  <BlProse as="article">
    <p>A second prose block rendered as an <code>article</code>.</p>
  </BlProse>
</template>

<script setup lang="ts">
  import {
    BlIndex,
    BlIndexRow,
    BlLinkArrow,
    BlMedia,
    BlMeta,
    BlPrevNext,
    BlProse,
    BlSectionHead
  } from '../../../vue'

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
