# Benchlight

Token-driven CSS, a Tailwind v4 theme and thin Vue and Nuxt components.

One token source generates prefixed plain CSS in cascade layers, a Tailwind theme and minified
bundles. The Vue components render exactly those classes, so the same design works in a Nuxt app,
a Vite app or a static page with no build step.

- **Plain CSS first.** Every component is a set of `.bl-*` classes in `@layer components`, usable
  without Vue. Your own CSS and utilities win without `!important`.
- **Built on native elements.** `<dialog>`, `<details>`, the popover API and real form controls,
  with ARIA states as the style hooks, 44px hit areas, 3:1 control borders and states that never
  rest on colour alone.
- **Light and dark.** An appearance switch with no flash on load, stored per visitor.
- **Small and modular.** Load the full bundle or only the modules a page uses.

## Install

```sh
npm install benchlight
```

Vue 3.5+ (and Nuxt 4 for the module) are optional peer dependencies: the CSS works on its own.

## Quick start

### Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['benchlight/nuxt']
})
```

The module adds the fonts, the component CSS, the no-flash appearance script and auto-imports for
every `Bl*` component and composable.

```vue
<!-- layouts/default.vue -->
<template>
  <BlSkipLink />
  <BlSiteBar>
    <template #brand><NuxtLink to="/" class="bl-site-bar__brand">My site</NuxtLink></template>
    <template #actions><BlAppearanceSwitch /></template>
  </BlSiteBar>
  <main id="main-content" class="bl-col"><slot /></main>
</template>
```

### Vite + Vue

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import { benchlight } from 'benchlight/vite'
import { defineConfig } from 'vite'

export default defineConfig({ plugins: [vue(), benchlight()] })
```

```ts
// main.ts
import 'benchlight/css/fonts.css'
import 'benchlight/css/index.css'
```

```vue
<script setup lang="ts">
  import { BlButton, BlField, BlInput } from 'benchlight/vue'
</script>
```

### Tailwind

Optional. With `@tailwindcss/vite` in the Vite plugins (`vite: { plugins: [tailwindcss()] }` in
Nuxt), import the theme after Tailwind in your stylesheet, for example `assets/main.css` (listed in
Nuxt's `css` option):

```css
@import 'tailwindcss';
@import 'benchlight/tailwind/theme.css';
```

The colour tokens become utilities such as `bg-surface`, `text-ink-1` and `border-control-border`.

### Plain HTML

Link `dist/benchlight.min.css` and `dist/fonts.min.css`, or only the `dist/modules/*.min.css` files
a page uses. See [Static pages](GUIDE.md#static-pages-no-build-step) for the appearance scripts.

## Components

Layout and navigation: BlSiteBar, BlTabBar, BlTabs, BlSegmentedNav, BlPrevNext, BlPagination,
BlIndex, BlSkipLink, BlColophon, BlSectionHead, BlProse, BlLinkArrow, BlAppearanceSwitch.

Forms: BlField, BlInput, BlTextarea, BlSelect, BlNumberField, BlRange, BlCheckbox, BlToggle,
BlRadioGroup, BlSegmented, BlButton.

Overlays and feedback: BlDialog, BlPopover, BlTooltip, BlToaster, BlMsg, BlDisclosure.

Data and status: BlTable, BlMeter, BlProgress, BlLed, BlReadout, BlTelemetry, BlSpecPanel,
BlLog, BlEqBars, BlMarquee, BlMedia, BlMeta.

Item components (BlSiteBarLink, BlTabBarItem, BlIndexRow, BlRadio, BlSpecRow, BlTelemetryCell)
go inside their parents.

## Documentation

- [GUIDE.md](GUIDE.md): setup options, tokens, conventions, CSP, and how each component behaves.
- [API.md](API.md): every export, prop, slot, event, CSS class and token, generated from source.
- [CHANGELOG.md](CHANGELOG.md): release notes, with migration tables for breaking changes.
- [CONTRIBUTING.md](CONTRIBUTING.md): development, tests and releasing.

## Browser support

Chrome 111, Safari 16.2 and Firefox 121. Newer features such as anchored popovers degrade where
missing; see [Browser support](GUIDE.md#browser-support) for details.

## License

[MIT](LICENSE). The bundled fonts (Geist, Geist Mono and Bricolage Grotesque) are under the SIL
Open Font License 1.1, in `fonts/`.
