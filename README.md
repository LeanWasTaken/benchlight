# Benchlight

Benchlight, the design system for my personal web projects. Not for client work.

One token source (`tokens/tokens.ts`) generates prefixed plain CSS in cascade layers, a Tailwind v4
theme, and minified bundles for any target, from apps to static pages. Thin Vue components render exactly those
classes.

## Install

```json
"benchlight": "git+ssh://git@github.com/LeanWasTaken/benchlight.git#v0.2.1"
```

The repo is private and the URL uses SSH on purpose: bun turns GitHub https URLs into API tarball
downloads that cannot authenticate to a private repo. Locally, plain SSH access to GitHub is enough.
In GitHub Actions, give each consuming repo its own read-only deploy key on `benchlight`
(`ssh-keygen -t ed25519`, add the public half under benchlight → Settings → Deploy keys, store the
private half as the secret `BENCHLIGHT_DEPLOY_KEY` in the consuming repo), and before `bun install`:

```yaml
- env:
    BENCHLIGHT_DEPLOY_KEY: ${{ secrets.BENCHLIGHT_DEPLOY_KEY }}
  run: |
    mkdir -p ~/.ssh
    printf '%s\n' "$BENCHLIGHT_DEPLOY_KEY" > ~/.ssh/id_ed25519
    chmod 600 ~/.ssh/id_ed25519
    echo "github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl" >> ~/.ssh/known_hosts
```

## Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['benchlight/nuxt'],
  app: { pageTransition: { name: 'bl-page', mode: 'out-in' } }
})
```

```css
/* app/assets/main.css, with @tailwindcss/vite */
@import 'tailwindcss';
@import 'benchlight/tailwind/theme.css';
```

The module adds the fonts and component CSS, the no-flash appearance script, auto-imported `Bl*`
components and composables (`useAppearance`, `useScrollLifted`, `useFollowScroll`, `useReducedMotion`, `useMarquee`,
`riseDelay`, `ansiToSegments`). `benchlight: { fonts: false }` skips the bundled fonts. `BlSiteBar`
wraps its nav in a `<nav>` landmark labelled by `navLabel` (default `Primary`).

```vue
<script setup lang="ts">
  import { NuxtLink } from '#components'
  const isActive = (path: string) => useRoute().path.startsWith(path)
</script>

<template>
  <BlSkipLink />
  <BlSiteBar>
    <template #brand><NuxtLink to="/" class="bl-site-bar__brand">MY SITE</NuxtLink></template>
    <template #nav>
      <BlNavLink :as="NuxtLink" to="/projects" :current="isActive('/projects')">Projects</BlNavLink>
    </template>
    <template #actions><BlAppearanceSwitch /></template>
  </BlSiteBar>
  <main id="main-content" class="bl-col"><slot /></main>
  <BlColophon :items="['© 2026 Your name']" />
</template>
```

## Vite + Vue

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
import { BlButton } from 'benchlight/vue'
```

`benchlight()` inlines the no-flash appearance script and keeps the shipped `.vue` source out of
dependency pre-bundling.

## Static pages (no build step)

- Inline `js/prepaint.js` in `<head>` and `js/appearance.js` before `</body>`.
- Link or inline `dist/benchlight.min.css`, or only the `dist/modules/<module>.min.css` files a page uses
  (`tokens` always first), plus `dist/fonts.min.css`.
- For size-critical pages, build a custom file: `bun scripts/bundle.ts --modules tokens,base,type,btn --inline-static --out page.min.css`
  (short non-colour tokens become literals; the output is self-contained).
- Compact font subsets are listed in `fonts/subset/manifest.json`.
- `playground/src/App.vue` is the markup reference.

## Conventions

- Everything global is prefixed: `.bl-*`, `--bl-*`, `bl-*` keyframes, `Bl*` components.
- Library CSS lives in `@layer base` / `@layer components`; utilities and your own CSS win without
  `!important`.
- States are ARIA or native attributes (`aria-current`, `aria-pressed`, `:checked`, `:disabled`);
  selected rows use `aria-current="true"`. Only `data-lifted` and `data-overflowing` are script-set.
- Appearance: `data-bl-appearance="light|dark"` on `<html>` (absent = auto), stored as
  `localStorage['bl-appearance']`.
- Text on a tint is `ink-1`, `trace` or `danger`; copper and phosphor are marks only there.

## Vue component notes

- **Composables:** `useFollowScroll(el, { enabled, threshold })` follows new content only while the
  reader is at the bottom. An enabled follower starts at the bottom on mount.
- **Fields:** BlField passes its `id` and hint id to BlInput, BlSelect and BlRange automatically.
  Your own `id` or `aria-describedby` on the control wins; for BlRange pass the `ariaDescribedby`
  prop, since its attrs land on the wrapper. To override the id, set `id` on BlField instead of on the
  control, so the `<label for>` still matches. For other controls, use the slot props
  `{ id, describedby }` or `inject(FIELD_CONTEXT)` from `benchlight/vue`.
- **Links:** `LinkProps` precedence: `as` a component (e.g. RouterLink) receives `to` if set,
  otherwise `href`; `as` `'a'` (the default when `to` or `href` is set) receives `href`, else a
  string `to`; `as` any other tag receives neither. Misuse logs a `[benchlight]` warning in
  development.
- **BlMeter:** `:value="null"` renders an indeterminate meter.
- **BlSectionHead:** bar mode renders `eyebrow` only (no `heading`). The `action` slot works in both
  modes.

## CSS hooks

`--bl-scroll-offset-top` and `--bl-scroll-offset-bottom` keep focused elements clear of fixed chrome
such as the sticky site bar and the mobile tab bar.

## API contract

`API.md` is generated by `bun run build`. Review a diff in it as the breaking-change checklist before
tagging.

## Tokens in JS

```ts
import { tokens } from 'benchlight/tokens'
tokens.color.dark.canvas // '#101214', e.g. for OG images that cannot read CSS variables
```

`benchlight/tokens` resolves at runtime to `dist/tokens.js`, because Nuxt's server bundler cannot compile
TypeScript from `node_modules`. Types still come from `tokens/index.ts`.

## Development

| Command                      | What it does                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `bun run check`              | lint, format check, typecheck, unit tests (incl. freshness, contrast, budgets)                    |
| `bun run fixtures`           | packs the working tree, builds and verifies the Nuxt and Vite fixtures                            |
| `bun run build`              | regenerates `css/tokens.css`, `tailwind/theme.css`, `dist/tokens.js` and the minified `dist/` CSS |
| `bun run playground`         | component showcase on Vite                                                                        |
| `bun run test:visual`        | Playwright axe, keyboard and screenshot checks of the playground (also run in CI on Linux)        |
| `scripts/visual-linux.sh`    | the same suite in CI's Linux image via Docker; add `--update-snapshots` to re-record Linux shots  |
| `bun scripts/fetch-fonts.ts` | re-fetches the pinned Google font files and `css/fonts.css`                                       |
| `scripts/subset-fonts.sh`    | re-cuts the compact font subsets with fontTools                                                   |

## Generated files

`dist/` (the minified CSS bundles and `dist/tokens.js`) is generated by `bun run build` and committed
on purpose: git installs do not run build scripts. Freshness tests in `bun run check` fail if it is
stale, so rebuild before committing token or CSS changes.

## Releasing

1. Update `CHANGELOG.md` and `version` in `package.json`.
2. `bun run build && bun run check && bun run fixtures`.
3. Commit `chore: release vX.Y.Z`, then `git tag -a vX.Y.Z -m vX.Y.Z` and push the tag.
4. Bump the `#vX.Y.Z` pin in each consumer.

Renaming or removing a token, class, prop, custom property or the appearance attribute/key is a
breaking change (`BREAKING CHANGE:` footer; minor bump while 0.x).
