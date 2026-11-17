# Benchlight guide

How the pieces fit together and how each component behaves. Exact prop, slot, event, class and
token lists are in [API.md](API.md); this guide covers what those lists cannot: defaults, edge
cases, accessibility contracts and CSS-only markup.

## Setup options

**Nuxt.** `modules: ['benchlight/nuxt']` adds the fonts and component CSS, the no-flash appearance
script, auto-imported `Bl*` components and composables. Auto-imported composables and helpers take
the `Bl` prefix (`useBlAppearance`, `useBlScrollLifted`, `useBlFollowScroll`, `useBlReducedMotion`,
`useBlMarquee`, `blRiseDelay`, `blAnsiToSegments`, `useBlToast`); explicit imports from
`benchlight/vue` keep the bare names. Module options, under the `benchlight` key:

- `fonts: false` skips the bundled fonts.
- `autoImports: false` skips the composable and helper auto-imports (components stay
  auto-imported). `autoImports: { prefix: 'Acme' }` renames them (`useAcmeToast`,
  `acmeRiseDelay`): the prefix goes after `use` for `use*` names and is prepended lower-cased for
  the rest; `prefix: ''` restores the bare names.
- `prepaint: false` drops the inline appearance script (see Content Security Policy).

The module also keeps lightningcss from lowering `:dir()`, so RTL styling survives Vite 8's default
CSS target.

**Vite.** `benchlight()` from `benchlight/vite` inlines the no-flash appearance script and keeps
`benchlight` out of Vite's dependency pre-bundling (the components are already compiled, so this is
a precaution, not a requirement). It also keeps lightningcss from lowering `:dir()`, so RTL styling
survives Vite 8's default CSS target. `@vitejs/plugin-vue` is only for your own `.vue` files.

**Tailwind** is optional. If the app uses it, add `@import 'benchlight/tailwind/theme.css';` after
`@import 'tailwindcss';`. The theme maps the colour tokens to utilities (`bg-surface`,
`text-ink-1`, `border-control-border`) and adds the `ease-bl` curve; Tailwind's own `ease-out` and
spacing utilities are left alone.

## Browser support

Build targets: Chrome 111, Safari 16.2 and Firefox 121. Newer features degrade where missing:

| Feature                                    | Floor                                | Without it                  |
| ------------------------------------------ | ------------------------------------ | --------------------------- |
| Anchored placement (BlPopover, BlTooltip)  | Chromium 129, Safari 26, Firefox 147 | panel stays centred, usable |
| Native popover                             | Chrome 114, Safari 17, Firefox 125   |                             |
| `:dir()` (RTL toggle thumb, checkbox tick) | Chrome 120, Safari 16.4              |                             |
| Alt-text `content: '!' / ''` (error marks) | Firefox 128, Safari 17.4             | plain mark                  |

RTL is explicitly supported for BlToggle and BlCheckbox and otherwise partial.

If you import the CSS through your own lightningcss or Vite setup without the Vite plugin or Nuxt
module, set `css.lightningcss.exclude` to include `Features.DirSelector`; lightningcss otherwise
rewrites `:dir(rtl)` into `:lang()` lists for targets without `:dir()` support (such as Chrome below
120), which ignore `dir="rtl"`.

## Colour tokens

Every colour is a `--bl-color-*` custom property (`canvas`, `surface`, `raised`, `separator`,
`control-border`, `ink-1` to `ink-3`, `trace`, `copper`, `phosphor`, `danger`, `on-trace`,
`on-danger`); Tailwind utilities keep their names (`bg-surface`, `text-ink-1`).

- `trace` is the accent and focus colour: links, focus rings, selected and pressed states.
- `phosphor` is the live/OK signal (an LED on, a success message).
- `copper` is the secondary warm accent and the ANSI colour in `BlLog`.
- `danger` is the error colour.
- `on-trace` and `on-danger` are the text and mark colour on a `trace` or `danger` fill (pressed
  buttons, the checkbox tick, the radio dot, the error disc). Both keep at least 4.5:1 against
  their fill in both themes, so re-theme `trace` and `danger` together with their on-colour.

## Spacing tokens

Padding, margin, gap and inset use a nine-step scale of `--bl-space-1` to `--bl-space-9`, in `rem`
so it follows the user's font size: `1` 0.25rem (4px), `2` 0.5rem (8px), `3` 0.75rem (12px), `4` 1rem
(16px), `5` 1.25rem (20px), `6` 1.5rem (24px), `7` 2rem (32px), `8` 2.5rem (40px), `9` 3rem (48px).
Use them in your own layout CSS to line up with the components. The scale is also in the JS `tokens`
export (`tokens.space`); it has no Tailwind theme entries, so Tailwind's own spacing utilities are unchanged.
Hairlines, focus offsets, 44px hit areas and optical nudges stay literal pixels.

## Content Security Policy

The Nuxt module and the Vite plugin inline the no-flash appearance script (`PREPAINT`) in `<head>`.

- Hash-based CSP works as shipped: add `PREPAINT_CSP_HASH` (the `'sha256-…'` source expression) to
  `script-src`. Both are exported from `benchlight/js/prepaint-script.mjs`.
- Nonce-based CSP (including `strict-dynamic`) blocks that inline script. Set `prepaint: false` and
  inline `PREPAINT` yourself with a fresh nonce on every response, the same one your
  `Content-Security-Policy` header carries. A nonce fixed in config or in a build is reused across
  responses and gives no protection.

Nuxt: turn the module's script off and add it from a Nitro plugin, which runs on every server
render. A prerendered or cached page would freeze one nonce, so do not prerender or cache
(`routeRules` `swr`, `isr` or `cache`) these routes.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['benchlight/nuxt'],
  benchlight: { prepaint: false }
})
```

```ts
// server/plugins/prepaint.ts
import { randomBytes } from 'node:crypto'
import { PREPAINT } from 'benchlight/js/prepaint-script.mjs'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nonce = randomBytes(16).toString('base64')
    // Your other scripts need this nonce too, or let your CSP module supply it.
    setResponseHeader(
      event,
      'Content-Security-Policy',
      `script-src 'nonce-${nonce}' 'strict-dynamic'`
    )
    html.head.unshift(`<script nonce="${nonce}">${PREPAINT}</script>`)
  })
})
```

Vite: turn the plugin's script off and add it where your server sends the HTML. Set
`html.cspNonce` to a placeholder so Vite puts it on its own `<script type="module">`, modulepreload
and stylesheet tags, then replace the placeholder with the request's nonce.

```ts
// vite.config.ts
import { benchlight } from 'benchlight/vite'
export default {
  html: { cspNonce: 'BL_NONCE' },
  plugins: [benchlight({ prepaint: false })]
}
```

```ts
// server.ts: the handler that sends the built index.html (`template`), here Express-style
import { randomBytes } from 'node:crypto'
import { PREPAINT } from 'benchlight/js/prepaint-script.mjs'

app.use((req, res) => {
  const nonce = randomBytes(16).toString('base64')
  // Every other inline or external script needs this nonce too; BL_NONCE covers Vite's own.
  res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}' 'strict-dynamic'`)
  const html = template.replaceAll('BL_NONCE', nonce)
  res.send(html.replace('<head>', `<head><script nonce="${nonce}">${PREPAINT}</script>`))
})
```

With `html.cspNonce` set, `vite build` also puts the placeholder on the plugin's own prepaint
script, so you can keep `prepaint` on and only do the `replaceAll`.

## Static pages (no build step)

- Inline `js/prepaint.js` in `<head>` and `js/appearance.js` (or `dist/appearance.min.js`) before `</body>`.
- Under a strict CSP, import `PREPAINT` (the script text) and `PREPAINT_CSP_HASH` (its
  `'sha256-…'` source expression) from `benchlight/js/prepaint-script.mjs`.
- `appearance.js` wires radio inputs named `bl-appearance` with the values `auto`, `light` and
  `dark`. Any element with `data-bl-lift="<px>"` (default 24) gets `data-lifted` once the page
  has scrolled that far.
- Link or inline `dist/benchlight.min.css`, or only the `dist/modules/<module>.min.css` files a page uses
  (`tokens` always first), plus `dist/fonts.min.css`.
- For size-critical pages, build a custom file from a clone of this repo: `bun scripts/bundle.ts --modules tokens,base,type,btn --inline-static --out page.min.css`
  (short non-colour tokens become literals; the output is self-contained). The CLI warns when the
  selected modules need `base` or `type` and they are missing.
- Compact font subsets are listed in `fonts/subset/manifest.json`.
- [`playground/src/App.vue`](playground/src/App.vue) in the repository is the markup reference.

## Conventions

- Everything global is prefixed: `.bl-*`, `--bl-*`, `bl-*` keyframes, `Bl*` components.
- `base` uses `html::after` for the 1px page scrollbar edge; reset it with
  `html::after { content: none }` if you need the pseudo-element.
- Library CSS lives in `@layer base` / `@layer components`; utilities and your own CSS win without
  `!important`.
- States are ARIA or native attributes (`aria-current`, `:checked`, `:disabled`, and `aria-pressed`
  on `.bl-btn` toggles only);
  the current item uses `aria-current` (`page`, `step`, `location` or `true`; any value but `false`
  is styled). The `data-*` attributes below are script-set, so do not set them yourself (apart from
  the CSS-only cases in the table notes). `data-lifted` (site bar, `js/appearance.js`),
  `data-overflowing` (BlMarquee), `data-fit`, `data-stacked` and `data-measuring` (BlTable),
  `data-ready` (BlAppearanceSwitch), `data-action`, `data-dir`,
  `data-label` and `data-empty` (BlTable), `data-side` and `data-align` (BlPopover, BlTooltip),
  `data-bl-appearance` (on `<html>`) and `data-bl-lift`
  (you set it; `js/appearance.js` reads it). Props are not mirrored as attributes in general: BlMedia
  `align="center"` becomes the class `.bl-media--center`, not a `data-align`.
- Appearance: `data-bl-appearance="light|dark"` on `<html>` (absent = auto), stored as
  `localStorage['bl-appearance']`.
  A user's theme change crossfades the whole page with a View Transition (`--bl-duration-base`)
  where the browser supports it and motion is allowed; otherwise it switches instantly. Changes
  that follow the OS in `auto` mode switch instantly.
- Text on a tint is `ink-1`, `trace` or `danger`; copper and phosphor are marks only there.
- Borders of controls (inputs, secondary buttons, switch thumb, selected segment, meter edge) use
  `--bl-color-control-border`, which keeps at least 3:1 against canvas, surface and raised. Hit
  areas are 44px. Forced-colors mode keeps LEDs, meter fill, EQ bars and the selected segment
  visible.

## Responsive rules

- Breakpoints are `em`, so they follow the user's font size: `sm` 40em (640px) and `xs` 30em (480px).
  The JS `tokens` export holds the px equivalents (`tokens.breakpoint`). The `md`, `lg` and `xl` breakpoints exist only there; there are no CSS custom properties or Tailwind theme entries for them, and the library CSS does not use them.
- Components size by the space they are given, through intrinsic grids and wrapping rather than
  viewport width, so they also work in a narrow card on a wide screen.
- Long unbroken content (URLs, hashes, compound words) wraps instead of widening the page.
- The repository's stress suite is the contract: `/stress.html` renders every component with hostile content and
  `tests/visual/stress.spec.ts` checks it (see [CONTRIBUTING.md](CONTRIBUTING.md)).
- **Link attrs.** `BlSiteBarLink` and `BlIndexRow` render an `li` around the link: `class` and `style`
  go on the `li`; `target`, `rel`, `aria-label`, `data-*` and listeners such as `@click` go on the
  inner link or button. A set `current` prop (`true`, `'page'`, `'step'` or `'location'`; `true` means `'page'`) wins over a
  consumer `aria-current`. `BlPrevNext` takes `linkAs` for the component that renders its links,
  and `ariaLabel` (default `Pagination`) for its nav.
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
- **Fields:** BlField passes its `id` and hint id to BlInput, BlTextarea, BlSelect, BlRange and BlNumberField
  automatically, and that id always wins inside a BlField (a different `id` on the control is
  ignored with a development warning, so the label keeps targeting it). Your own `aria-describedby` is merged: the
  hint id comes first, then the error id, then yours, without duplicates. BlRange forwards fallthrough attrs (`id`, `aria-label`,
  `name`, listeners; `disabled` is a prop on BlInput, BlSelect, BlTextarea and BlRange) to the slider, which carries the class `bl-range__input`; `class`
  and `style` stay on the wrapper. To override the id, set `id` on BlField instead of on the
  control, so the `<label for>` still matches. For other controls, use the slot props
  `{ id, describedBy, invalid }` or `inject(FIELD_CONTEXT)` from `benchlight/vue`, which holds
  `{ id, describedBy, invalid }` as refs. `describedBy` is the hint id then the error id,
  space-joined. Read `invalid` as `field?.invalid?.value === true`, so a control also works under
  a provider that predates it.
- **Field errors:** set `error` on BlField to mark it invalid; marking it invalid is your job,
  Benchlight only renders it. An empty string is not an error. BlField adds
  `.bl-field--invalid` and a `p.bl-field__error` (id `<id>-error`) after the hint; BlInput,
  BlTextarea, BlSelect and BlRange get `aria-invalid="true"` and the error id in
  `aria-describedby`. Your own `aria-invalid` on the control wins. The error is not a live region
  by default; set `announce` on BlField to render it with `role="alert"` so a screen reader hears it. The error line starts
  with a "!" mark and the control border thickens, so the state does not rest on colour. In plain
  HTML, `[aria-invalid='true']` on `.bl-input`, `.bl-textarea` or `.bl-select` gets the same
  styling. Native `required` passes through to the control; there is no built-in required marker.
  BlToggle, BlCheckbox and BlRadioGroup carry their own label, so they take their own `error`
  prop with the same output (`.bl-toggle__error`, `.bl-checkbox__error`, `.bl-fieldset__error`).
- **BlInput:** renders a bare `<input>` with no wrapper, so `class`, `style` and every attribute
  land on the input. `type` is `'text' | 'email' | 'password' | 'search' | 'tel' | 'url'`
  (default `'text'`); `number` is left out because the model is a string.
- **Form reset:** every form control follows a native `form.reset()` (also for a control tied to its
  form with `form="id"` from outside it), so the model never keeps a stale value. Every control
  restores the model value it had at mount (this overrides a consumer `value` attribute; later
  model changes do not become the default). BlNumberField restores its mount number, or empty
  (`null`). The model is written after the reset has finished, only when it differs, and not when
  another listener cancels the reset. The form is resolved once at mount. BlSegmented takes a
  `form` prop and BlRadioGroup forwards its `form` attribute to its radios, for a form outside
  the group.
- **BlTextarea:** the multi-line sibling of BlInput, with the same contract: no wrapper, every
  attribute (including `class` and `style`) on the `<textarea>`, a string `v-model`, and the
  field wiring above. `rows` defaults to 4; it resizes vertically only and does not autosize.
- **Links:** `LinkProps` precedence: `as` a component (e.g. RouterLink) receives `to` if set,
  otherwise `href`; `as` `'a'` (the default when `to` or `href` is set) receives `href`, else a
  string `to`; `as` any other tag receives neither. Misuse logs a `[benchlight]` warning in
  development. `href` and `to` values are passed to the anchor unchanged, so never feed them
  untrusted `javascript:` URLs.
- **BlLog:** text is in `rem` and the default height is 12.5rem (`--bl-log-height`). `offset` is
  the absolute index of `lines[0]`; set it when you trim a capped buffer so rows are reused. **BlMsg** is a live region: keep it mounted and change its text, since inserting
  it with `v-if` may not be announced.
- **BlSiteBar** wraps its nav in a `<nav>` landmark named by `ariaLabel` (default `Primary`; a
  plain `aria-label` works too). `lift` is reactive. **BlPrevNext** renders nothing without neighbours. `LinkTo`
  accepts any object, so typed router locations pass.
- **BlButton:** fill only the `icon` slot for an icon-only button (`bl-btn--icon`, 44px square;
  `pill` makes it a circle) and name it with `ariaLabel` (sets `aria-label`; it is for icon-only buttons
  and replaces visible text as the accessible name, so a dev warning flags it on a button with
  text). `pressed` makes a toggle button (`aria-pressed`, all variants; ignored on links) with an
  inset ring as well as a colour change. `variant="ghost"` is transparent until hovered. The dev
  warnings run after mount and again whenever the props, attributes or slot content change. With raw
  CSS, add `bl-btn--icon`, `bl-btn--ghost` or `aria-pressed` yourself.
- **BlMeter and BlProgress:** BlMeter is a gauge (`role="meter"`, a disk or battery level) and
  BlProgress is a task (`role="progressbar"`, an upload). Both take `value` 0 to 1 and emit
  `aria-valuemin="0"`, `aria-valuemax="100"` and `aria-valuenow` as a whole percentage. BlMeter's
  `value` is a plain `number`: above 1 it dev-warns and renders full, and it has no indeterminate
  state. BlProgress takes `:value="null"` for indeterminate (no `aria-valuenow`, `bl-meter--indeterminate`,
  and no visible value). `valueText` sets `aria-valuetext` ("2.1 of 4 GB"). `label` renders visible
  text above the bar (and names it); with no visible text use `ariaLabel`. `showValue` renders the
  value visibly (`valueText` or a percentage, `aria-hidden`). A dev warning fires when neither
  `label` nor `ariaLabel` is set. BlProgress uses the `meter` CSS module. CSS-only: wrap the bar,
  `<div class="bl-meter-field"><div class="bl-meter-field__head"><span class="bl-meter-field__label">…</span><span class="bl-meter-field__value">…</span></div><div class="bl-meter" role="meter" …></div></div>`
  (`role="progressbar"` for a task; add `bl-meter--indeterminate` and drop `aria-valuenow` for an
  unknown one); the wrapper owns the block margin. `class` and `style` go on the outer element (the
  wrapper when wrapped, otherwise the bar); every other attribute goes on the bar.
- **BlTelemetry:** `--bl-telemetry-columns` sets the column count at every width. The default is
  auto-fit with 12rem cells; with no custom columns, six cells lay out 3x2 when there is room.
- **BlSpecPanel:** rows wrap: the label is 8rem and the value drops below it when narrow.
- **BlColophon:** wraps, and is left-aligned when narrow.
- **BlMsg:** content sits in `.bl-msg__text`; raw-CSS users should wrap their text in it.
- **BlRange:** the track keeps at least 96px. `--bl-range-value-width` reserves room for the value
  (default 56px), so the track does not change length while dragging.
- **BlMeta:** `separator` draws dashes in CSS (`.bl-meta--sep`), with no separator elements.
- **BlMarquee / `useMarquee`:** re-measures when the container, the content or the fonts change.
  Under reduced motion, overflowing text wraps instead. The scroll holds still while the pointer is
  over it or focus is inside it, and while `paused` is true (`useMarquee(box, text, { paused })`).
  `BlMarquee` also stops itself (WCAG 2.2.2): while text scrolls it renders a small `<button
type="button" class="bl-marquee__toggle">` beside the text (`aria-pressed` is true while paused,
  Space, Enter or a tap toggles). The marquee itself is never a button, so links and other
  controls in the slot stay valid. Its name is `labels.pause` (default `Pause scrolling`; keep the
  wording constant, the state is `aria-pressed`). When focus moves to something inside the text,
  the scroll holds and that element is scrolled into view; leaving restores the loop. There is no
  button when the text fits or under reduced motion. `paused` is a model (`v-model:paused`, or
  `:paused` alone to control it from outside; it works uncontrolled too) and `update:paused` fires
  only on user toggles. Attributes such as `aria-label` land on the wrapper, which has no role.
  The mask and scrolling live on `.bl-marquee__viewport`.
- **BlSegmented / BlSegmentedNav:** both wrap, with a 16px row gap. `BlSegmented` is a native radio
  group: `<BlSegmented v-model="size" :options="[{ value: 's', label: 'S', disabled: true }]"
aria-label="Size" />` (`disabled` is optional per option; `name` optional, `compact`; works
  without `v-model`; a form reset restores the mount value; a model matching no option checks
  nothing and emits nothing). `BlSegmentedNav` is a `<nav>` of links:
  `<BlSegmentedNav :items="[{ label: 'en', href: '/en', current: true }]" aria-label="Language"
link-as="…" />`; each item needs `to` or `href`, and `current` is
  `boolean | 'page' | 'step' | 'location'`. An item's own `as` overrides `linkAs` for that item.
- **Inputs and selects:** 16px on coarse pointers, so iOS does not zoom on focus.
- **BlSelect / `.bl-select-wrap`:** BlSelect renders `<span class="bl-select-wrap"><select
class="bl-select">`; `class` and `style` go on the wrapper (so `$el` is the wrapper: use `$el.querySelector('select')`,
  and style the control with `.x > .bl-select` or `:deep(.bl-select)`), other attributes and listeners on the select. In
  CSS-only markup the same wrapper draws a themed chevron (`--bl-chevron-mask`, `--bl-color-ink-2`) and
  hides the native arrow for a single-line select; a bare `.bl-select` keeps the native arrow, and
  `multiple` or `size` selects keep theirs inside the wrapper.
- **BlProse:** the measure is `min(720px, 68ch)`; images, video and iframes are capped to the column;
  tables scroll horizontally (`display: block`, so add `role="table"` if assistive tech should keep the
  table semantics); display sizes are smaller on phones (`xl` is 40px at 320px wide).
- **BlSectionHead:** bar mode renders `eyebrow` only (no `heading`). The `actions` slot works in both
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
- **Columns** (`TableColumn<Row>`) come in three kinds, all with `label`, `align?`, `numeric?`,
  `width?` and `primary?`. A **key column** `{ key, format?, sortable?, sortBy?, total?, formatTotal? }`
  shows a field: `key` must be a key of `Row` and `format(value, row)` gets `Row[key]`. A **derived
  column** `{ key, value(row), format?, ... }` shows a computed value; `format` gets what `value`
  returns. Inside a `TableColumn<Row>[]` array, annotate a derived column's `format` parameter or
  type the column as `DerivedColumn<Row, V>`. A **slot-only column** `{ key, slot: true }` renders
  only through its `cell-<key>` slot and is never sorted or totalled. With literal columns
  (`[...] as const satisfies readonly TableColumn<Row>[]`) each `cell-<key>` slot's `value` follows
  its column: `Row[key]`, what `value` returns, or `undefined` for a slot-only column, and an unknown
  slot name fails type-checking. Columns typed `TableColumn<Row>[]` have `string` keys, so there
  every cell slot's `value` is `unknown`. The primary column (the first unless one sets `primary`)
  is the row header. `v-model:sort` and `v-model:page` are optional; set `rowKey` when sorting,
  paging or using row actions.
- **Attrs:** the naming, description and structure attributes (`aria-label`, `aria-labelledby`,
  `aria-describedby`, `aria-description`, `aria-details`, `aria-roledescription`, `aria-rowcount`,
  `aria-colcount`) go on the `<table>`, so a note on units or a totals row can describe it. Every
  other attribute stays on the wrapper `div.bl-table`: `class`, `style`, `id`, `data-*`, listeners
  and the state attributes `aria-hidden`, `aria-busy` and `aria-live` (which must cover the sort
  strip and pagination too).
- **Slots:** `caption`, `empty`, `footer` and the dynamic `cell-<key>` (`{ row, value, column }`) and
  `head-<key>` (`{ column }`) per column key. API.md lists them under BlTable.
- **`manual` mode** is for server-side sorting and paging: rows are shown as given, nothing is sorted
  or sliced. Pass `totalRows` (a dev warning fires if `pageSize` is set without it) and `totals`.
- **Row actions:** `rowLink(row)` (an `a`, RouterLink or similar, as with `LinkProps`) or
  `@row-activate`; `rowLink` wins if both are set. The primary cell holds the real link or button.
  Clicking anywhere on the row forwards to it, except on other controls and while text is selected.
  Modifier-clicks work only on the link itself. API.md lists the event as `onRowActivate`; in a
  template you write `@row-activate`.
- **Totals:** a column `total` of `'sum'`, `'avg'`, `'count'` or a function over all rows (not just the
  page); a function returns a number. `formatTotal(value, rows)` formats every kind (else `String()`);
  `format` never applies to totals, and `manual` mode's `totals` render as given. The footer renders
  the cells; the `footer` slot replaces them.
- **i18n:** `labels` (`total`, `empty`, `sortStrip`, `sortAscending`, `sortDescending`, and
  `pages: (caption) => string` for the pagination's name) and `paginationLabels` (`prev`,
  `next`, `page`, `pageOf`, `range`); `locale` sets the sort collation (default `'en'`, so a
  server-rendered sort hydrates unchanged; for example `locale="lv"`). Every `labels` prop in the
  library (BlAppearanceSwitch, BlPrevNext, BlDialog, BlToaster, BlPagination, BlTable) treats an
  `undefined` value as "use the default", so an i18n lookup that finds nothing never blanks a
  string. BlAppearanceSwitch also takes `labels.marks` (`{ auto, light, dark }`, default A / L / D).
- With async data, BlTable clamps `page` to 1 while there are no rows, so set the page after rows
  arrive (or use `manual` with `totalRows`).
- **BlPagination** renders nothing for a single page. Standalone: `total`, `pageSize`,
  `v-model:page`, and `ariaLabel` to name the nav (a dev warning fires when it is not set).
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

`v-model` is optional: without it the toggle keeps its own state, so a plain form post works
(`<BlToggle name="wifi" label="Wi-Fi" />`).

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

- Props: `v-model` (boolean), `label`, `hint`, `error`, `disabled`, `name`, `value`. With `name`,
  the form posts `name=value` only while the switch is on.
- `error` marks the switch invalid: `aria-invalid="true"` on the input, a
  `span.bl-toggle__error` after the hint, and its id after the hint id in `aria-describedby`.
  In plain HTML, `aria-invalid="true"` on `.bl-toggle__input` draws the invalid track.
- The hint stays out of the accessible name: it sits outside the `label` and is wired up with
  `aria-describedby`. A consumer `aria-describedby` is merged with the hint id.
- Uncontrolled without `v-model`: the toggle keeps its own state; `:model-value` without a
  listener is just the initial value.
- A native form reset restores the value the toggle had when it mounted, emitting
  `update:modelValue` if that changes it.
- Not for use inside BlField; the toggle carries its own label and hint.
- Attrs split: `class` and `style` go on the root `div.bl-toggle`; every other attribute (`id`,
  `data-*`, `aria-*`) goes on the `input`.
- The thumb moves with a logical inset, so RTL flips it. "On" is shown by position and an inner mark,
  not colour alone.

## BlCheckbox

A checkbox drawn over a native `<input type="checkbox">`, shaped like BlToggle. Full prop list is
in [API.md](API.md).

```vue
<BlCheckbox v-model="backups" label="Nightly backups" hint="Runs at 03:00 local time" />
<BlCheckbox v-model="all" v-model:indeterminate="some" label="All channels" />
```

```html
<div class="bl-checkbox">
  <label class="bl-checkbox__control">
    <input class="bl-checkbox__input" type="checkbox" aria-describedby="backups-hint" />
    <span class="bl-checkbox__box" aria-hidden="true"></span>
    <span class="bl-checkbox__label">Nightly backups</span>
  </label>
  <span id="backups-hint" class="bl-checkbox__hint">Runs at 03:00 local time</span>
</div>
```

- Props: `v-model` (boolean), `v-model:indeterminate` (boolean), `label`, `hint`, `error`,
  `disabled`, `name`, `value`. The box shows a tick when checked, a dash when indeterminate and
  nothing when unchecked, so the state never rests on colour.
- `indeterminate`: bind `v-model:indeterminate` and handle `update:indeterminate`. A click clears
  the dash natively and the checkbox emits `update:indeterminate` with `false`; setting it back to
  `true` restores the dash. If the parent ignores that update, setting `true` again is a no-op
  until the value changes.
- `indeterminate` is a DOM property, not an attribute. Server-rendered HTML shows no dash until the
  component mounts, and in CSS-only use you set it from script
  (`input.indeterminate = true`); the box draws the dash from `:indeterminate`.
- `error`, the hint, attrs and form reset work as on BlToggle: `class` and `style` go on the root,
  every other attribute on the input, the hint and error stay out of the accessible name, and a
  native form reset restores the value the checkbox had when it mounted.
- Not for use inside BlField. For a group, see the fieldset recipe below.

## BlRadioGroup and BlRadio

A `fieldset` with a `legend` that owns the model and the `name`; each BlRadio is one option.

```vue
<BlRadioGroup v-model="band" legend="Band" hint="Arrow keys move between options.">
  <BlRadio label="2.4 GHz" value="2.4" hint="Longer range" />
  <BlRadio label="5 GHz" value="5" />
</BlRadioGroup>
```

```html
<fieldset class="bl-fieldset bl-radio-group" role="radiogroup" aria-describedby="band-hint">
  <legend class="bl-fieldset__legend">Band</legend>
  <p id="band-hint" class="bl-fieldset__hint">Arrow keys move between options.</p>
  <div class="bl-radio">
    <label class="bl-radio__control">
      <input class="bl-radio__input" type="radio" name="band" value="2.4" />
      <span class="bl-radio__dot" aria-hidden="true"></span>
      <span class="bl-radio__label">2.4 GHz</span>
    </label>
  </div>
</fieldset>
```

- BlRadioGroup props: `v-model` (`string | number | undefined`; `undefined` is no selection, and
  a reset with nothing checked emits it), `legend`, `hint`, `error`, `disabled`, `required`,
  `name` (generated when omitted). All its attrs, `class` and `style` included, go on
  the fieldset. Add `bl-fieldset--inline` to lay the options out in a row.
- BlRadio props: `label`, `value`, `hint`, `disabled`. `class` and `style` go on the root `div.bl-radio`; other attrs go on the `<input>`, as on BlToggle and BlCheckbox. It belongs
  inside a BlRadioGroup; on its own it warns in development and renders a plain radio from its
  attrs.
- Keyboard is the native one: Tab enters and leaves the group at the checked radio, and the arrow
  keys move and select.
- `error` adds `.bl-fieldset--invalid` (a bar down the leading edge), a `p.bl-fieldset__error`,
  `aria-invalid="true"` on the fieldset and the error id in its `aria-describedby`. Each radio's
  `aria-describedby` holds only its own hint, so arrow-key moves do not re-read the group message.
- `required` puts `required` on every radio and `aria-required` on the fieldset. A native form
  reset restores the value the group had when it mounted.
- The `radio` module needs the `fieldset` module.

### Checkbox groups (CSS only)

There is no checkbox group component. Wrap BlCheckbox children (or the plain markup above) in the
`fieldset` classes:

```html
<fieldset class="bl-fieldset bl-fieldset--invalid" aria-describedby="topics-hint topics-error">
  <legend class="bl-fieldset__legend">Notify me about</legend>
  <p id="topics-hint" class="bl-fieldset__hint">Pick any.</p>
  <p id="topics-error" class="bl-fieldset__error">Choose at least one topic.</p>
  <!-- BlCheckbox children, or .bl-checkbox markup -->
</fieldset>
```

`bl-fieldset--invalid` and the error line are yours to add and remove. Like every error in
Benchlight, `.bl-fieldset__error` is not a live region; in plain HTML add `role="alert"` where you want it
announced. BlRadioGroup, BlCheckbox, BlToggle and BlField take `announce` for the same. A live
region announces only errors that appear after mount, so keep rendering the error conditionally
through the `error` prop (set it when validation fails, clear it when it passes).

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
- Setting `open` to false and back to true within one task (before the browser's async `close`
  event) closes and reopens it: the first session reports `close` with reason `'program'` and no
  `update:open` echo, and the late `close` event is ignored.
- CSS-only: the classes work on any `<dialog>`. Call `showModal()`/`close()` yourself, wire the
  ids and add `closedby="none"` for a non-dismissible dialog. The panel may be wrapped, e.g. in a
  `<form method="dialog">` that closes it without script. The panel is only visible inside an open
  `.bl-dialog` (it fades in with it), so it cannot be shown on its own. Backdrop-click closing, gutter
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
- BlToaster takes `class`, `data-*` and `aria-*` on its `<section class="bl-toaster">` (inside the
  teleport); its `ariaLabel` prop (default `Notifications`) names it.
- BlToaster props: `max` (default 3 visible; the rest queue first in, first out), `ariaLabel` and
  `labels` (`{ dismiss, actionHint }`, defaults `'Dismiss'` and
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
  is announced where the toaster lands next, and while a closing dialog fades out (Chromium) the
  toaster stays above it in the top layer, as a manual popover, until the fade ends.
- The store is one per JS realm, shared by every Vue app on the page, so mount one toaster per
  page; a development warning fires for a second.
- SSR: `toast()` does nothing on the server and returns `''`. The toaster renders its section and
  both live regions empty, and the list only after mount, so a toast fired before hydration
  cannot cause a mismatch.
- In Nuxt the auto-import is `useBlToast`, so it does not collide with Nuxt UI's `useToast`.
  `import { useToast } from 'benchlight/vue'` keeps the bare name.
- CSS-only: the classes work on the markup above; timers, queueing and announcements are yours.
  A toaster outside an open modal dialog is inert, so place it inside the dialog while one is
  open.

## BlPopover

A disclosure panel on the native popover API, anchored to its trigger. Full prop list is in
[API.md](API.md). `popover` needs the `anchored` module (the bundle CLI warns otherwise).

```vue
<BlPopover v-model:open="open" side="bottom" align="start" aria-label="Filters">
  <template #trigger="{ bind }"><BlButton v-bind="bind">Filters</BlButton></template>
  <p>Anything interactive goes here.</p>
</BlPopover>
```

- Props: `side` (`PopoverSide`), `align` (`PopoverAlign`), `ariaLabel`; `v-model:open`. The
  `trigger` slot's `bind` carries `id`, `type="button"` (so a trigger inside a form does not submit
  it), `aria-expanded`, `aria-controls`, `popovertarget` and the anchor name; spread it on one
  button.
- It is the disclosure pattern: the panel has no role unless `ariaLabel` is set, then
  `role="group"`. Esc and outside click close it (native light dismiss).
- A controlled-only `open` that ignores `update:open` still sees Esc and outside click close the
  native popover.
- One button can trigger a popover and carry a tooltip. `mergeProps` keeps only one
  `style.anchorName`, so one panel would lose its anchor; `anchor-name` takes a comma-separated
  list, so set both names after the merge:

  ```vue
  <BlPopover>
    <template #trigger="{ bind: pop }">
      <BlTooltip text="Narrow the list">
        <template #trigger="{ bind: tip }">
          <BlButton
            v-bind="mergeProps(pop, tip)"
            :style="{ anchorName: `${pop.style.anchorName}, ${tip.style.anchorName}` }"
          >
            Filters
          </BlButton>
        </template>
      </BlTooltip>
    </template>
    <p>Anything interactive goes here.</p>
  </BlPopover>
  ```

  `mergeProps` comes from `vue`.

- Placement needs CSS anchor positioning with `position-area` (Chromium 129, Safari 26, Firefox
  147); without it the panel stays centred in the viewport. Exit animations run in Chromium only;
  Safari and Firefox close instantly.
- Set the writing direction with the `dir` attribute, not CSS `direction`: Firefox places the
  panel correctly under a nested `dir` only.

## BlTooltip

A plain-text hint on a native popover, shown on hover and focus. Full prop list is in
[API.md](API.md). Needs the `anchored` module.

```vue
<BlTooltip text="Copy link" side="top">
  <template #trigger="{ bind }"><BlButton v-bind="bind">Copy</BlButton></template>
</BlTooltip>
```

- Props: `text`, `side`, `align`, `delay` (ms, default 400). The trigger's `bind` sets `aria-describedby`.
- Hover and focus only; hover is ignored for touch. Esc dismisses; inside a dialog or a popover
  the first Esc hides only the tooltip and the next one closes the container. Text only, no
  interactive content (use BlPopover for that).
- On a button that also triggers a BlPopover, set both anchor names (see BlPopover).
- Same browser requirements as BlPopover.

## BlTabs

A tablist with panels, in the WAI-ARIA tabs pattern. Full prop list is in [API.md](API.md).

```vue
<BlTabs
  v-model="tab"
  aria-label="Sections"
  :items="[
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' }
  ]"
>
  <template #panel-a>First</template>
  <template #panel-b>Second</template>
</BlTabs>
```

- Props: `items` (`TabItem[]`: `value`, `label`, optional `disabled`), `ariaLabel`, `activation`
  (`auto` or `manual`); `v-model` is the selected value. Panel slots are `panel-<value>`.
- A model that names no enabled tab shows the first enabled one and emits nothing until the user
  picks.
- Arrow keys, Home and End move between enabled tabs; Tab moves into the panel.

## BlNumberField

A numeric input with a `number | null` model, inside BlField. Needs the `field` module.

```vue
<BlField label="Quantity"><BlNumberField v-model="qty" :min="0" :max="10" /></BlField>
```

- Props: `min`, `max`, `step`, `disabled`; other attributes go to the `<input>`. `null` is empty.
- The value is clamped to `[min, max]` on commit (blur or Enter), not while typing and not for
  values set from outside.
- It does not block the mouse wheel (a focused field blurs on wheel). A native `form.reset()`
  writes the reset element's number (or `null` when empty) to the model.

## CSS hooks

Custom properties a consumer may set. API.md lists them under "CSS hooks".

| Hook                                                  | Sets                                                                         | Default                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------ |
| `--bl-scroll-offset-top`, `--bl-scroll-offset-bottom` | clearance for focused elements under fixed chrome (site bar, mobile tab bar) | `72px`, `0px` (literals) |
| `--bl-anchored-gap`                                   | gap between a BlPopover or BlTooltip panel and its trigger                   | `6px`                    |
| `--bl-popover-width`                                  | max width of a BlPopover panel, never wider than the viewport less 16px      | `20rem`                  |
| `--bl-tooltip-width`                                  | max width of a BlTooltip panel, never wider than the viewport less 16px      | `16rem`                  |
| `--bl-dialog-width`                                   | width of a centred BlDialog, never wider than the viewport less 32px         | `32rem`                  |
| `--bl-media-size`                                     | size of a BlMedia figure                                                     | `64px`                   |
| `--bl-chevron-mask`                                   | chevron shape of both the select and the disclosure                          | built-in chevron         |
| `--bl-meter-value`                                    | fill fraction of a BlMeter bar (0 to 1; BlMeter and BlProgress set it)       | `0`                      |
| `--bl-rise-delay`                                     | page-enter animation delay of one element (`riseDelay()` sets it)            | `0ms`                    |
| `--bl-telemetry-columns`                              | column count of a BlTelemetry grid                                           | auto-fit                 |
| `--bl-log-height`                                     | max height of a BlLog                                                        | `12.5rem`                |
| `--bl-range-value-width`                              | room reserved for the BlRange value, so the track length stays fixed         | `56px`                   |
| `--bl-table-min-col`                                  | narrowest BlTable column before the table stacks                             | `8rem`                   |
| `--bl-table-col-min`                                  | narrowest width of one column (BlTable sets it from `TableColumn.width`)     | `--bl-table-min-col`     |

`--bl-dialog-gutter` is internal: BlDialog sets it on `html` while open.

## Component to module

`dist/modules/<module>.min.css` takes the module name, which differs from the component name in
places. `tokens` always comes first; `base`, `type`, `motion`, `layout` and `tints` are shared.

| Component                                       | Module                         |
| ----------------------------------------------- | ------------------------------ |
| BlSiteBar, BlSiteBarLink                        | `site-bar`                     |
| BlTabBar, BlTabBarItem                          | `tab-bar`                      |
| BlColophon                                      | `colophon`                     |
| BlSkipLink                                      | `skip-link`                    |
| BlAppearanceSwitch                              | `appearance`                   |
| BlSegmented, BlSegmentedNav                     | `segmented`                    |
| BlButton                                        | `btn`                          |
| BlField, BlInput, BlTextarea, BlSelect, BlRange | `field`                        |
| `.bl-fieldset` (CSS only)                       | `fieldset`                     |
| BlLinkArrow                                     | `link-arrow`                   |
| BlSpecPanel, BlSpecRow                          | `spec-panel`                   |
| BlTelemetry, BlTelemetryCell                    | `telemetry`                    |
| BlLed                                           | `led`                          |
| BlEqBars                                        | `eq`                           |
| BlMarquee                                       | `marquee`                      |
| BlReadout                                       | `readout`                      |
| BlMeter                                         | `meter`                        |
| BlProgress                                      | `meter`                        |
| BlMsg                                           | `msg`                          |
| BlLog                                           | `log`                          |
| BlSectionHead                                   | `section-head`                 |
| BlMeta                                          | `meta`                         |
| BlIndex, BlIndexRow                             | `index-row`                    |
| BlPrevNext                                      | `prev-next`                    |
| BlProse                                         | `prose`                        |
| BlTable                                         | `table`                        |
| BlPagination                                    | `pagination`                   |
| BlToggle                                        | `toggle`                       |
| BlCheckbox                                      | `checkbox`                     |
| BlRadioGroup, BlRadio                           | `radio` (needs `fieldset`)     |
| BlMedia                                         | `media`                        |
| BlDisclosure                                    | `disclosure`                   |
| BlDialog                                        | `dialog`                       |
| BlToaster                                       | `toast`                        |
| (shared placement for popovers)                 | `anchored`                     |
| BlPopover                                       | `popover` (needs `anchored`)   |
| BlTooltip                                       | `tooltip` (needs `anchored`)   |
| BlTabs                                          | `tabs`                         |
| BlNumberField                                   | `number-field` (needs `field`) |

## Supported entry points

`package.json` lists every public path explicitly, and Node refuses anything else. There is no root
entry: `import 'benchlight'` does not resolve, so import a subpath. Everything not listed here is
internal and may move in a minor release:

- `benchlight/vue`, `benchlight/nuxt`, `benchlight/vite`, `benchlight/tokens`
- `benchlight/tailwind/theme.css`
- `benchlight/css/index.css`, `benchlight/css/fonts.css` and the foundations `benchlight/css/{tokens,base,type,motion,layout,tints}.css`
- `benchlight/css/components/*.css` (needs `css/tokens.css`, which sets the layer order)
- `benchlight/dist/benchlight.min.css`, `benchlight/dist/fonts.min.css`, `benchlight/dist/appearance.min.js` and `benchlight/dist/modules/*.min.css`
- `benchlight/js/appearance.js`, `benchlight/js/prepaint.js` and `benchlight/js/prepaint-script.mjs`
- `benchlight/fonts/subset/*`

## Tokens in JS

```ts
import { tokens } from 'benchlight/tokens'
tokens.color.dark.canvas // '#101214', e.g. for OG images that cannot read CSS variables
```

`benchlight/tokens` resolves at runtime to `dist/tokens.js`, because Nuxt's server bundler cannot compile
TypeScript from `node_modules`. Types come from the generated `dist/tokens.d.ts`.
