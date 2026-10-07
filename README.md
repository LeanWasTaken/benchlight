# Benchlight

Benchlight, the design system for my personal web projects. Not for client work.

One token source (`tokens/tokens.ts`) generates prefixed plain CSS in cascade layers, a Tailwind v4
theme, and minified bundles for any target, from apps to static pages. Thin Vue components render exactly those
classes.

## Install

```json
"benchlight": "git+ssh://git@github.com/LeanWasTaken/benchlight.git#v0.6.0"
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
`riseDelay`, `ansiToSegments`, `useToast`). `benchlight: { fonts: false }` skips the bundled fonts. `BlSiteBar`
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

Size budget: `dist/benchlight.min.css` stays at or under 53,248 B (52 KiB) (`wc -c dist/benchlight.min.css`,
`tests/bundle.test.ts`; it was 28,672 B in v0.3) and the compact font subsets under 23,552 B in total
(`tests/fonts.test.ts`). The guard is raised in round KiB when legitimate work needs it, and every
raise gets a CHANGELOG line.

## Conventions

- Everything global is prefixed: `.bl-*`, `--bl-*`, `bl-*` keyframes, `Bl*` components.
- `base` uses `html::after` for the 1px page scrollbar edge; reset it with
  `html::after { content: none }` if you need the pseudo-element.
- Library CSS lives in `@layer base` / `@layer components`; utilities and your own CSS win without
  `!important`.
- States are ARIA or native attributes (`aria-current`, `aria-pressed`, `:checked`, `:disabled`);
  selected rows use `aria-current="true"`. Only `data-lifted`, `data-overflowing`, `data-fit`,
  `data-stacked` and `data-measuring` are script-set.
- Appearance: `data-bl-appearance="light|dark"` on `<html>` (absent = auto), stored as
  `localStorage['bl-appearance']`.
- Text on a tint is `ink-1`, `trace` or `danger`; copper and phosphor are marks only there.
- Borders of controls (inputs, secondary buttons, switch thumb, selected segment, meter edge) use
  `--bl-control-border`, which keeps at least 3:1 against canvas, surface and raised. Hit areas are
  44px. Forced-colors mode keeps LEDs, meter fill, EQ bars and the selected segment visible.

### Adding a component

1. `css/components/x.css`, in `@layer components`, prefixed `bl-`.
2. Add it to `MODULES` in `scripts/lib/modules.ts`; the order is pinned by `tests/css-conventions.test.ts`.
   If it needs another module's CSS, declare that in `REQUIRES` in the same file (the bundle CLI
   warns when a requirement is missing).
3. Import it in `css/index.css`, in the same order.
4. `vue/components/BlX.vue`, with an inline literal `defineProps` type (consumers may lack
   TypeScript; `tests/vue/sfc-props.test.ts` enforces it). Export it from `vue/index.ts` and cover it in
   `tests/vue/barrel.test.ts`.
5. A new composable also goes into `AUTO_IMPORTS` in `nuxt/module.ts`.
6. Add it to the playground (`playground/src/App.vue`).
7. Add stress cases (long content, narrow container, flex/inline host) to `playground/src/Stress.vue`.
8. `bun run build` regenerates `dist/` and `API.md`.
9. Re-record the baselines on both platforms: `bunx playwright test --update-snapshots -g "renders every"`
   and `scripts/visual-linux.sh --update-snapshots -g "renders every"`.
10. One commit per component.

## Responsive rules

- Breakpoints are `em`, so they follow the user's font size: `sm` 40em (640px) and `xs` 30em (480px).
  The `md`, `lg` and `xl` tokens exist for Tailwind and consumers; the library CSS does not use them.
- Components size by the space they are given, through intrinsic grids and wrapping rather than
  viewport width, so they also work in a narrow card on a wide screen.
- Long unbroken content (URLs, hashes, compound words) wraps instead of widening the page.
- The stress suite is the contract: `/stress.html` renders every component with hostile content and
  `tests/visual/stress.spec.ts` checks it (see Development).
- **Gutter.** `BlIndexRow` and `BlPrevNext` links bleed 12px either side for the hover background, so
  the host needs at least 12px of side padding. `.bl-col` provides 16-24px.
- **Site bar.** The nav scrolls horizontally on one line when it does not fit. A brand under about
  7rem never truncates; a longer one ends in an ellipsis; the appearance switch never moves. Below
  40em the nav stays visible unless a `BlTabBar` is on the page. On screens under 30em tall the bar is
  static instead of sticky. Bar controls have a negative `scroll-margin` so focusing one never scrolls
  the page; as a side effect `scrollIntoView()` or a `#hash` aimed at a bar control lands up to about
  34px off, so target page content instead.
- **Tab bar.** Five tabs at most; labels end in an ellipsis.
- **iOS safe areas.** Fixed bars, body padding, scroll offsets and `.bl-col` respect the insets, but
  only when the page sets `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

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
- **BlLog:** text is in `rem` and the default height is 12.5rem (`--bl-log-height`). `offset` is
  the absolute index of `lines[0]`; set it when you trim a capped buffer so rows are reused. **BlMsg** is a live region: keep it mounted and change its text, since inserting
  it with `v-if` may not be announced.
- **BlSiteBar** `lift` is reactive. **BlPrevNext** renders nothing without neighbours. `LinkTo`
  accepts any object, so typed router locations pass.
- **BlButton:** fill only the `icon` slot for an icon-only button (`bl-btn--icon`, 44px square;
  `pill` makes it a circle) and name it with `label` (sets `aria-label`; it is for icon-only buttons
  and replaces visible text as the accessible name, so a dev warning flags it on a button with
  text). `pressed` makes a toggle button (`aria-pressed`, all variants; ignored on links) with an
  inset ring as well as a colour change. `variant="ghost"` is transparent until hovered. The dev
  warnings run after mount and again whenever the props, attributes or slot content change. With raw
  CSS, add `bl-btn--icon`, `bl-btn--ghost` or `aria-pressed` yourself.
- **BlMeter:** `:value="null"` renders an indeterminate meter. `valueText` sets `aria-valuetext`
  ("2.1 of 4 GB"). `showLabel` and `showValue` render the label and value visibly (the value is
  `valueText` or a percentage, hidden while indeterminate and `aria-hidden`); the bar is then
  labelled by the visible label. CSS-only: wrap the bar,
  `<div class="bl-meter-field"><div class="bl-meter-field__head"><span class="bl-meter-field__label">…</span><span class="bl-meter-field__value">…</span></div><div class="bl-meter" role="progressbar" …></div></div>`;
  the wrapper owns the block margin. `class` and `style` go on the outer element (the wrapper when
  wrapped, otherwise the bar); every other attribute goes on the progressbar.
- **BlTelemetry:** `--bl-telemetry-columns` now applies at every width (it used to apply only from
  640px). The default is auto-fit with 12rem cells; with no custom columns, six cells lay out 3x2 when
  there is room.
- **BlSpecPanel:** rows wrap: the label is 8rem and the value drops below it when narrow.
- **BlColophon:** wraps, and is left-aligned when narrow.
- **BlMsg:** content sits in `.bl-msg__text`; raw-CSS users should wrap their text in it.
- **BlRange:** the track keeps at least 96px. `--bl-range-value-width` reserves room for the value
  (default 56px), so the track does not change length while dragging.
- **BlMeta:** `separator` draws dashes in CSS (`.bl-meta--sep`); the `.bl-meta__sep` element is gone.
- **BlMarquee / `useMarquee`:** re-measures when the container, the content or the fonts change.
  Under reduced motion, overflowing text wraps instead.
- **BlSegmented:** wraps, with a 16px row gap.
- **Inputs and selects:** 16px on coarse pointers, so iOS does not zoom on focus.
- **BlSelect / `.bl-select-wrap`:** BlSelect renders `<span class="bl-select-wrap"><select
class="bl-select">`; `class` and `style` go on the wrapper (so `$el` is the wrapper: use `$el.querySelector('select')`,
  and style the control with `.x > .bl-select` or `:deep(.bl-select)`), other attributes and listeners on the select. In
  CSS-only markup the same wrapper draws a themed chevron (`--bl-chevron-mask`, `--bl-ink-2`) and
  hides the native arrow for a single-line select; a bare `.bl-select` keeps the native arrow, and
  `multiple` or `size` selects keep theirs inside the wrapper.
- **BlProse:** the measure is `min(720px, 68ch)`; images, video and iframes are capped to the column;
  tables scroll horizontally (`display: block`, so add `role="table"` if assistive tech should keep the
  table semantics); display sizes are smaller on phones (`xl` is 40px at 320px wide).
- **BlSectionHead:** bar mode renders `eyebrow` only (no `heading`). The `action` slot works in both
  modes.

## BlTable and BlPagination

Full prop, slot and event lists are in [API.md](API.md). `table` needs the `layout` and `pagination`
modules and `pagination` needs `layout` (the bundle CLI warns otherwise).

- **Stacking is measured, not a breakpoint.** The table stacks into cards when its natural width does
  not fit its container. The narrowest column is `--bl-table-min-col` (default 8rem) or the column's
  `width`; text cells break long unbroken strings. Stacked tables show a "Sort by" strip (its buttons
  carry `data-dir`). Before hydration a table stacks only below 30em (CSS fallback), so a wider one may
  render unstacked for a frame until measured. The fit re-measures on container width, data and font
  load, not when the user changes text size at runtime without a width change.
- **Grid and flex hosts.** A BlTable inside a CSS grid or flex item needs `min-width: 0` (or
  `min-inline-size: 0`) on that item; otherwise the item grows to the table's width and it never stacks.
- **Scroll mode:** `scroll` never stacks; the table scrolls horizontally and the first column is sticky.
- **Columns** are `{ key, label, align?, numeric?, sortable?, sortBy?, format?, width?, primary?, total? }`.
  The primary column (the first unless one sets `primary`) is the row header. `v-model:sort` and
  `v-model:page` are optional; set `rowKey` when sorting, paging or using row actions.
- **Slots:** `caption`, `empty`, `footer` and the dynamic `cell-<key>` (`{ row, value, column }`) and
  `head-<key>` (`{ column }`) per column key. The dynamic ones are not listed in API.md.
- **`manual` mode** is for server-side sorting and paging: rows are shown as given, nothing is sorted
  or sliced. Pass `totalRows` (a dev warning fires if `pageSize` is set without it) and `totals`.
- **Row actions:** `rowLink(row)` (an `a`, RouterLink or similar, as with `LinkProps`) or
  `@row-activate`; `rowLink` wins if both are set. The primary cell holds the real link or button.
  Clicking anywhere on the row forwards to it, except on other controls and while text is selected.
  Modifier-clicks work only on the link itself.
- **Totals:** a column `total` of `'sum'`, `'avg'`, `'count'` or a function over all rows (not just the
  page). `format(value)` formats the result. The footer renders the cells; the `footer` slot replaces
  them.
- **i18n:** `labels` (`total`, `empty`, `sortStrip`) and `paginationLabels` (`nav`, `prev`, `next`,
  `page`, `pageOf`, `range`); `locale` sets the sort collation.
- With async data, BlTable clamps `page` to 1 while there are no rows, so set the page after rows
  arrive (or use `manual` with `totalRows`).
- **BlPagination** renders nothing for a single page. Standalone: `total`, `pageSize`, `label`,
  `v-model:page`.
- **CSS-only use:** wrap a `table` in `div.bl-table` (modifiers `.bl-table--compact`,
  `.bl-table--scroll`). Classes: `.bl-table__num`, `.bl-table__primary`, `.bl-table__label` (a
  `span aria-hidden="true"` in each body cell), `.bl-table__sort`, `.bl-table__sort-strip`,
  `.bl-table__action`, `.bl-table__empty`; pagination uses `.bl-pagination`, `__list`, `__item`,
  `__page`, `__gap`, `__range` and `__compact` (the "Page X of Y" text shown under 30em, where `__item`
  is hidden); `__prev` and `__next` are hook classes only and carry no styles. Add explicit roles
  (`role="table"`, `rowgroup`, `row`, `columnheader`, `rowheader`, `cell`), because stacked layouts
  drop native table semantics, and `data-label` on body cells (a `::before` fallback renders it when
  there is no `.bl-table__label`). Mark a totals cell with nothing to show `data-empty` so it drops
  out of the stacked card. Set `data-stacked` yourself, or rely on the stack-below-30em fallback.
  `.bl-table--scroll` never stacks.

## BlToggle

An on/off switch on a native checkbox (`role="switch"`). Full prop list is in [API.md](API.md).

```vue
<BlToggle v-model="wifi" label="Wi-Fi" hint="Joins known networks automatically" />
```

```html
<div class="bl-toggle">
  <label class="bl-toggle__control">
    <input class="bl-toggle__input" type="checkbox" role="switch" aria-describedby="wifi-hint" />
    <span class="bl-toggle__track" aria-hidden="true"><span class="bl-toggle__thumb"></span></span>
    <span class="bl-toggle__label">Wi-Fi</span>
  </label>
  <span id="wifi-hint" class="bl-toggle__hint">Joins known networks automatically</span>
</div>
```

- Props: `v-model` (boolean), `label`, `hint`, `disabled`, `name`, `value`. With `name`, the form
  posts `name=value` only while the switch is on.
- The hint stays out of the accessible name: it sits outside the `label` and is wired up with
  `aria-describedby`. A consumer `aria-describedby` is merged with the hint id.
- Controlled only: `:model-value` without an `update:modelValue` listener is just an initial value.
- A native form reset restores the value the toggle had when it mounted and re-emits it as
  `update:modelValue`.
- Not for use inside BlField; the toggle carries its own label and hint.
- Attrs split: `class` and `style` go on the root `div.bl-toggle`; every other attribute (`id`,
  `data-*`, `aria-*`) goes on the `input`.
- The thumb moves with a logical inset, so RTL flips it. "On" is shown by position and an inner mark,
  not colour alone.

## BlMedia

A figure beside a body, with an optional aside. Layout only: it adds no semantics, so give the
figure its own `alt`/`aria-label` and choose `as` to fit the surrounding list or article. Full prop
list is in [API.md](API.md).

```vue
<BlMedia as="li" align="center">
  <template #figure><img src="/thumb.png" alt="" /></template>
  <strong>Project title</strong>
  <template #aside>v2</template>
</BlMedia>
```

```html
<li class="bl-media bl-media--center">
  <div class="bl-media__figure"><img src="/thumb.png" alt="" /></div>
  <div class="bl-media__body"><strong>Project title</strong></div>
  <div class="bl-media__aside">v2</div>
</li>
```

- Slots: `figure`, default (the body) and `aside`. The `figure` and `aside` wrappers are omitted when
  their slot renders nothing, including `v-if` placeholders and whitespace.
- Props: `as` (`div`, `li` or `article`; default `div`) and `align` (`start`, the default, or
  `center`, which adds `.bl-media--center`).
- `--bl-media-size` sets the figure's `img`, `video` and `svg` size (default 64px).
- Wrapping rule: the body asks for 12rem beside the figure and wraps below it when it cannot get
  that, with no measuring. Long unbroken text breaks inside the body.

## BlDisclosure

A collapsible section on native `<details>`. Full prop list is in [API.md](API.md).

```vue
<BlDisclosure v-model:open="faqA" summary="What does this do?" name="faq">
  <p>It shows one answer at a time.</p>
</BlDisclosure>
```

```html
<details class="bl-disclosure" name="faq" open>
  <summary class="bl-disclosure__summary">
    <span class="bl-disclosure__title">What does this do?</span>
    <span class="bl-disclosure__chevron" aria-hidden="true"></span>
  </summary>
  <div class="bl-disclosure__body"><p>It shows one answer at a time.</p></div>
</details>
```

- Props: `summary` (or the `summary` slot for rich content), `open` and `name`; emits `update:open`.
- `name` groups disclosures so opening one closes the others (Chrome 120+, Safari 17.2+, Firefox
  130+; older browsers open them independently). The browser-closed sibling also emits
  `update:open(false)`, so each `v-model` stays in step.
- `open` without `v-model` is the initial state only.
- The summary is not a heading; wrap the disclosure if you need one.
- The chevron reuses `--bl-chevron-mask`.

## BlDialog

A modal on native `<dialog>` and `showModal()`: a centred box from 40em up, a bottom sheet below.
Full prop list is in [API.md](API.md). `dialog` needs the `btn` module for its close button (the
bundle CLI warns otherwise).

```vue
<BlDialog v-model:open="renameOpen" title="Rename item" description="Names show in lists.">
  <BlField label="Name"><BlInput v-model="name" autofocus /></BlField>
  <template #footer>
    <BlButton variant="secondary" @click="renameOpen = false">Cancel</BlButton>
    <BlButton @click="save">Save</BlButton>
  </template>
</BlDialog>
```

```html
<dialog class="bl-dialog" aria-labelledby="t" aria-describedby="d">
  <div class="bl-dialog__panel">
    <div class="bl-dialog__head">
      <h2 class="bl-dialog__title" id="t">Rename item</h2>
      <button class="bl-btn bl-btn--ghost bl-btn--icon bl-dialog__close" aria-label="Close">
        …
      </button>
    </div>
    <p class="bl-dialog__description" id="d">Names show in lists.</p>
    <div class="bl-dialog__body">…</div>
    <div class="bl-dialog__foot">…</div>
  </div>
</dialog>
```

- Props: `open` (`v-model:open`), `title`, `description`, `dismissible` (default `true`) and
  `labels` (`{ close }`, default `'Close'`). Slots: default (the body, which scrolls) and `footer`.
- Emits `update:open(false)` and `close({ reason, returnValue })` exactly once per close. `reason`
  is `'button'` (the ×), `'backdrop'`, `'escape'` (Esc, the back gesture, `requestClose()` or a
  `request-close` invoker, which all fire `cancel`), `'program'` (the parent set `open` to false;
  no `update:open` echo) or `'native'` (`<form method="dialog">`, a `close` invoker command).
  `returnValue` is the string given to `close()`, or `''`.
- A backdrop click counts only when the press also started on the backdrop, so a drag from inside
  the panel does not close.
- `dismissible: false` drops the ×, ignores backdrop clicks and renders `closedby="none"`, which
  blocks Esc and the Android back gesture in Chrome 134+ and Firefox 141+; `cancel` is also
  prevented for Safari. Chromium before 134 may still close on a repeated Esc or back gesture
  (its CloseWatcher anti-abuse rule); the close is then reported as `'escape'` or `'native'`
  and `v-model` stays in step. In development a warning fires when the footer is empty, since
  nothing could close the dialog.
- Focus: the browser focuses the first focusable element, which is the × in a dismissible dialog.
  Put `autofocus` on the least destructive action or on the first field. On close, focus returns
  to the opener unless a `@close` handler moved it elsewhere; unmounting an open dialog closes
  it quietly (no emits) and restores focus too.
- Scroll lock: `html:has(dialog.bl-dialog[open]:modal)` hides the `html` overflow; the component
  measures the scrollbar it removes into `--bl-dialog-gutter` so the page does not shift. An app
  that scrolls `body` instead of `html` is not locked. CSS-only users get no compensation; opt
  in with `html { scrollbar-gutter: stable }`.
- Below 40em the dialog is a bottom sheet clear of the safe areas. `dvh` does not shrink for the
  iOS keyboard, so a field near the bottom of a sheet can sit behind it.
- Known limitation: setting `open` to false and back to true within one task (before the
  browser's async `close` event) leaves the dialog closed; the late `close` then emits
  `update:open(false)`, so state stays consistent and the reopen is dropped.
- CSS-only: the classes work on any `<dialog>`. Call `showModal()`/`close()` yourself, wire the
  ids and add `closedby="none"` for a non-dismissible dialog. Backdrop-click closing, gutter
  compensation, focus-restore hardening and in-dialog toasts are Vue-only.

## BlToast

Short, queued notifications: `useToast()` adds them and one `<BlToaster />` shows them. `toast`
needs the `btn` module for its buttons and `layout` for the `.bl-sr-only` live regions (the bundle
CLI warns otherwise). Mount the toaster once, as the last element of the app root:

```vue
<template>
  <NuxtPage />
  <BlToaster />
</template>
```

```ts
const { toast, dismiss, clear } = useToast()
toast('Saved')
toast({ message: 'Upload failed', tone: 'danger' })
const id = toast({ message: 'Item deleted', action: { label: 'Undo', onClick: restore } })
```

```html
<section class="bl-toaster" aria-label="Notifications">
  <ol class="bl-toaster__list">
    <li class="bl-toast bl-toast--success">
      <span class="bl-toast__mark" aria-hidden="true"></span>
      <p class="bl-toast__message" id="m">Saved</p>
      <button class="bl-btn bl-btn--ghost bl-toast__action">Undo</button>
      <button
        class="bl-btn bl-btn--ghost bl-btn--icon bl-toast__dismiss"
        aria-label="Dismiss"
        aria-describedby="m"
      >
        …
      </button>
    </li>
  </ol>
  <div class="bl-sr-only" role="status"></div>
  <div class="bl-sr-only" role="alert"></div>
</section>
```

- `toast(input)` takes a string or `{ message, tone, action, duration, id }` and returns the id;
  `dismiss(id)` is a no-op for unknown ids; `clear()` removes everything.
- `tone` is `'neutral'` (default, no mark), `'success'` (a circle) or `'danger'` (a diamond plus
  an inline-start edge), so tones never rely on colour alone.
- `duration` is in ms: 5000 by default, and `0` (stays until dismissed) when there is an `action`.
  Give an action toast a duration only if the action is also available elsewhere, and never make
  a toast the only place important information appears (WCAG 2.2.1). A click on the action runs
  `onClick`, then dismisses the toast, even if `onClick` throws (the error still surfaces).
- Re-toasting an existing `id` replaces it in place: a visible toast keeps its slot and its timer
  restarts; a queued one keeps its queue position.
- BlToaster props: `max` (default 3 visible; the rest queue first in, first out) and `labels`
  (`{ region, dismiss, actionHint }`, defaults `'Notifications'`, `'Dismiss'` and
  `` (label) => `${label} available` ``).
- Timers pause while a mouse pointer is over the toaster, while focus is inside it and while the
  tab is hidden, then resume with the time left. Toasts never take focus; when a focused toast
  goes, focus moves to the next toast's dismiss button, else back to where it came from, else it
  is blurred. A BlDialog opened from a toast action returns focus there too when it closes, since
  the action's toast is gone by then.
- Announcements: each toast is announced when it becomes visible (so speech follows the visual
  order), danger in the `role="alert"` region and the rest in `role="status"`, with
  `", Undo available"` appended for an action. Repeats are announced again; an id replace is
  announced only if the message changed.
- Toasts inside open dialogs: a modal makes everything outside it inert, so while a BlDialog is
  open the toaster moves into the topmost one (above its backdrop, reachable and announced) and
  moves back when it closes. Visible toasts and timers carry across. Below 40em it sits at the
  top of the screen there, clear of the sheet's footer actions. A toast fired as a dialog closes
  is announced where the toaster lands next.
- The store is one per JS realm, shared by every Vue app on the page, so mount one toaster per
  page; a development warning fires for a second.
- SSR: `toast()` does nothing on the server and returns `''`. The toaster renders its section and
  both live regions empty, and the list only after mount, so a toast fired before hydration
  cannot cause a mismatch.
- Nuxt UI also auto-imports a `useToast`. In an app that uses both, import Benchlight's
  explicitly where you need it: `import { useToast } from 'benchlight/vue'`.
- CSS-only: the classes work on the markup above; timers, queueing and announcements are yours.
  A toaster outside an open modal dialog is inert, so place it inside the dialog while one is
  open.

## CSS hooks

`--bl-scroll-offset-top` and `--bl-scroll-offset-bottom` keep focused elements clear of fixed chrome
such as the sticky site bar and the mobile tab bar.

`--bl-dialog-width` sets the width of a centred BlDialog (default `32rem`, never wider than the
viewport less 32px). `--bl-dialog-gutter` is internal: BlDialog sets it on `html` while open.

`--bl-media-size` sets the size of a BlMedia figure (default `64px`).

`--bl-chevron-mask` replaces the chevron shape of both the select and the disclosure.

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

| Command                                            | What it does                                                                                                                                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run check`                                    | lint, format check, typecheck, unit tests (incl. freshness, contrast, budgets)                                                                                                                     |
| `bun run fixtures`                                 | packs the working tree, builds and verifies the Nuxt and Vite fixtures; not in `check`, runs in CI                                                                                                 |
| `bun run lint:workflows`                           | actionlint over `.github/workflows` (needs Docker)                                                                                                                                                 |
| `bun run build`                                    | regenerates tokens, theme, `js/prepaint-script.mjs`, `dist/` (CSS, JS), and `API.md`                                                                                                               |
| `bun run playground`                               | component showcase on Vite                                                                                                                                                                         |
| `bun run test:visual`                              | Playwright axe, keyboard and screenshot checks of the playground (also run in CI on Linux)                                                                                                         |
| `bunx playwright test tests/visual/stress.spec.ts` | the stress suite (desktop-light only); view the page with `bun run playground` at `/stress.html`. `STRESS_BREAK=overflow\|stack\|small\|overlap` breaks layout on purpose to prove the checks bite |
| `scripts/visual-linux.sh`                          | the same suite in CI's Linux image via Docker; add `--update-snapshots` to re-record Linux shots                                                                                                   |
| `bun scripts/fetch-fonts.ts`                       | re-fetches the pinned Google font files and `css/fonts.css`                                                                                                                                        |
| `scripts/subset-fonts.sh`                          | re-cuts the compact font subsets with fontTools                                                                                                                                                    |

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
