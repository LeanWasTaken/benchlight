# Benchlight

Benchlight, the design system for my personal web projects. Not for client work.

One token source (`tokens/tokens.ts`) generates prefixed plain CSS in cascade layers, a Tailwind v4
theme, and minified bundles for any target, from apps to static pages. Thin Vue components render exactly those
classes.

## Install

```json
"benchlight": "git+ssh://git@github.com/LeanWasTaken/benchlight.git#v0.3.0"
```

The repo is private and the URL uses SSH on purpose: bun turns GitHub https URLs into API tarball
downloads that cannot authenticate to a private repo. Locally, plain SSH access to GitHub is enough.
Use bun 1.4.2 or newer: bun 1.2.x cannot clone git dependencies on Linux.
In GitHub Actions, give each consuming repo its own read-only deploy key on `benchlight`
(`ssh-keygen -t ed25519`, add the public half under benchlight → Settings → Deploy keys, store the
private half as the secret `BENCHLIGHT_DEPLOY_KEY` in the consuming repo). Install like this, so the
key is used only by that step:

```yaml
- name: Load the Benchlight deploy key
  env:
    BENCHLIGHT_DEPLOY_KEY: ${{ secrets.BENCHLIGHT_DEPLOY_KEY }}
  run: |
    umask 077
    key="$RUNNER_TEMP/benchlight_deploy_key"
    hosts="$RUNNER_TEMP/benchlight_known_hosts"
    printf '%s\n' "$BENCHLIGHT_DEPLOY_KEY" > "$key"
    echo "github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl" > "$hosts"
    echo "DEPLOY_KEY_FILE=$key" >> "$GITHUB_ENV"
    echo "DEPLOY_KNOWN_HOSTS=$hosts" >> "$GITHUB_ENV"
- name: Install
  run: |
    export GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY_FILE -o IdentitiesOnly=yes -o UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS -o StrictHostKeyChecking=yes"
    bun install --frozen-lockfile
- name: Remove the deploy key
  if: always()
  run: rm -f "$DEPLOY_KEY_FILE" "$DEPLOY_KNOWN_HOSTS"
```

## Nuxt

```ts
// nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['benchlight/nuxt'],
  css: ['~/assets/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: { pageTransition: { name: 'bl-page', mode: 'out-in' } }
})
```

```css
/* app/assets/main.css */
@import 'tailwindcss';
@import 'benchlight/tailwind/theme.css';
```

The module adds the fonts and component CSS, the no-flash appearance script, auto-imported `Bl*`
components and composables (`useAppearance`, `useScrollLifted`, `useFollowScroll`, `useReducedMotion`, `useMarquee`,
`riseDelay`, `ansiToSegments`). `benchlight: { fonts: false }` skips the bundled fonts. `BlSiteBar`
wraps its nav in a `<nav>` landmark labelled by `navLabel` (default `Primary`). The Tailwind lines are
optional: skip them if the app does not use Tailwind.

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
dependency pre-bundling. Tailwind is optional: only if the app uses it, add
`@import 'benchlight/tailwind/theme.css';` after `@import 'tailwindcss';`. The theme maps the
`--bl-control-border` token to the `border-control-border` utility.

## Static pages (no build step)

- Inline `js/prepaint.js` in `<head>` and `js/appearance.js` (or `dist/appearance.min.js`) before `</body>`.
- Under a strict CSP, import `PREPAINT` (the script text) and `PREPAINT_CSP_HASH` (its
  `'sha256-…'` source expression) from `benchlight/js/prepaint-script.mjs`.
- `appearance.js` wires radio inputs named `bl-appearance` with the values `auto`, `light` and
  `dark`. Any element with `data-bl-lift="<px>"` (default 24) gets `data-lifted` once the page
  has scrolled that far.
- Link or inline `dist/benchlight.min.css`, or only the `dist/modules/<module>.min.css` files a page uses
  (`tokens` always first), plus `dist/fonts.min.css`.
- For size-critical pages, build a custom file: `bun scripts/bundle.ts --modules tokens,base,type,btn --inline-static --out page.min.css`
  (short non-colour tokens become literals; the output is self-contained). The CLI warns when the
  selected modules need `base` or `type` and they are missing.
- Compact font subsets are listed in `fonts/subset/manifest.json`.
- `playground/src/App.vue` is the markup reference.

Size budget: `dist/benchlight.min.css` stays at or under 28,672 B (`wc -c dist/benchlight.min.css`,
`tests/bundle.test.ts`) and the compact font subsets under 23,552 B in total (`tests/fonts.test.ts`).
Raising either needs a CHANGELOG line.

## Conventions

- Everything global is prefixed: `.bl-*`, `--bl-*`, `bl-*` keyframes, `Bl*` components.
- Library CSS lives in `@layer base` / `@layer components`; utilities and your own CSS win without
  `!important`.
- States are ARIA or native attributes (`aria-current`, `aria-pressed`, `:checked`, `:disabled`);
  selected rows use `aria-current="true"`. Only `data-lifted` and `data-overflowing` are script-set.
- Appearance: `data-bl-appearance="light|dark"` on `<html>` (absent = auto), stored as
  `localStorage['bl-appearance']`.
- Text on a tint is `ink-1`, `trace` or `danger`; copper and phosphor are marks only there.
- Borders of controls (inputs, secondary buttons, switch thumb, selected segment, meter edge) use
  `--bl-control-border`, which keeps at least 3:1 against canvas, surface and raised. Hit areas are
  44px. Forced-colors mode keeps LEDs, meter fill, EQ bars and the selected segment visible.

### Adding a component

1. `css/components/x.css`, in `@layer components`, prefixed `bl-`.
2. Add it to `MODULES` in `scripts/lib/modules.ts`; the order is pinned by `tests/css-conventions.test.ts`.
3. Import it in `css/index.css`, in the same order.
4. `vue/components/BlX.vue`, with an inline literal `defineProps` type (consumers may lack
   TypeScript; `tests/vue/sfc-props.test.ts` enforces it). Export it from `vue/index.ts` and cover it in
   `tests/vue/barrel.test.ts`.
5. A new composable also goes into `AUTO_IMPORTS` in `nuxt/module.ts`.
6. Add it to the playground (`playground/src/App.vue`).
7. `bun run build` regenerates `dist/` and `API.md`.
8. Re-record the baselines on both platforms: `bunx playwright test --update-snapshots -g "renders every"`
   and `scripts/visual-linux.sh --update-snapshots -g "renders every"`.
9. One commit per component.

## Vue component notes

- **Composables:** `useFollowScroll(el, { enabled, threshold })` follows new content only while the
  reader is at the bottom. An enabled follower starts at the bottom on mount.
  `useScrollLifted(threshold)` takes a number, `false`, a ref or a getter. Both it and
  `useReducedMotion()` return a ref that is `false` on the server and until mounted.
- **Fields:** BlField passes its `id` and hint id to BlInput, BlSelect and BlRange automatically.
  Your own `id` or `aria-describedby` on the control wins. BlRange forwards fallthrough attrs
  (`aria-label`, `disabled`, `name`, listeners) to the slider; `class` and `style` stay on the
  wrapper. Its explicit `ariaDescribedby` and `id` props win over the field context. To override the
  id, set `id` on BlField instead of on the control, so the `<label for>` still matches. For other controls, use the slot props
  `{ id, describedby }` (lowercase, a slot prop) or `inject(FIELD_CONTEXT)` from `benchlight/vue`,
  which holds `{ id, describedBy }` as refs (camelCase).
- **Links:** `LinkProps` precedence: `as` a component (e.g. RouterLink) receives `to` if set,
  otherwise `href`; `as` `'a'` (the default when `to` or `href` is set) receives `href`, else a
  string `to`; `as` any other tag receives neither. Misuse logs a `[benchlight]` warning in
  development.
- **BlLog:** `offset` is the absolute index of `lines[0]`; set it when you trim a capped buffer so
  rows are reused. **BlMsg** is a live region: keep it mounted and change its text, since inserting
  it with `v-if` may not be announced.
- **BlSiteBar** `lift` is reactive. **BlPrevNext** renders nothing without neighbours. `LinkTo`
  accepts any object, so typed router locations pass.
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

| Command                      | What it does                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `bun run check`              | lint, format check, typecheck, unit tests (incl. freshness, contrast, budgets)                     |
| `bun run fixtures`           | packs the working tree, builds and verifies the Nuxt and Vite fixtures; not in `check`, runs in CI |
| `bun run lint:workflows`     | actionlint over `.github/workflows` (needs Docker)                                                 |
| `bun run build`              | regenerates tokens, theme, `js/prepaint-script.mjs`, `dist/` (CSS, JS), and `API.md`               |
| `bun run playground`         | component showcase on Vite                                                                         |
| `bun run test:visual`        | Playwright axe, keyboard and screenshot checks of the playground (also run in CI on Linux)         |
| `scripts/visual-linux.sh`    | the same suite in CI's Linux image via Docker; add `--update-snapshots` to re-record Linux shots   |
| `bun scripts/fetch-fonts.ts` | re-fetches the pinned Google font files and `css/fonts.css`                                        |
| `scripts/subset-fonts.sh`    | re-cuts the compact font subsets with fontTools                                                    |

## Generated files

`dist/` (the minified CSS bundles and `dist/tokens.js`) is generated by `bun run build` and committed
on purpose: git installs do not run build scripts. Freshness tests in `bun run check` fail if it is
stale, so rebuild before committing token or CSS changes.

## Releasing

`bun pm pack` decides what ships: the `files` list in `package.json` plus the always-included files.
Consumer tags contain only that, never tests or the playground.

1. In one `chore: release vX.Y.Z` commit, bump `version` in `package.json`, add the entry to
   `CHANGELOG.md` and move the README install pin to `#vX.Y.Z`.
2. `bun run build && bun run check && bun run fixtures`.
3. Push `main`, then push the source tag: `git tag -a src-vX.Y.Z -m src-vX.Y.Z && git push origin src-vX.Y.Z`.
   Never push `vX.Y.Z` yourself.
4. CI checks that the commit is on `main` and matches `package.json`, runs the checks, builds the
   slim tree from `bun pm pack`, commits it to the `release` branch and tags that commit `vX.Y.Z`.
   A separate job then installs the tag over git+ssh and verifies it is slim.
5. Bump the `#vX.Y.Z` pin in each consumer. The URL form is unchanged.

Tags up to v0.2.1 are full-tree source tags. Release tags from v0.3.0 on point into the `release`
branch.

Renaming or removing a token, class, prop, custom property or the appearance attribute/key is a
breaking change (`BREAKING CHANGE:` footer; minor bump while 0.x).
