# Changelog

## Unreleased

### Tests/CI

- A manual `publish` workflow (`.github/workflows/publish.yml`) publishes `benchlight` to npm with
  provenance through npm trusted publishing (OIDC, no token), on a `src-vX.Y.Z` tag. Before its
  first run, the GitHub-side protections listed at the top of the workflow file are mandatory: the
  `npm-publish` environment limited to `src-v*` tags with required reviewers, an admin-only
  `src-v*` tag ruleset and a `main` ruleset. `package.json` gains `publishConfig` (public access,
  provenance).
- The behaviour specs (cross-browser, popover, tooltip, tabs, number-field) now also run in Firefox
  and WebKit, as `firefox` and `webkit` Playwright projects. They take no screenshots, so there are
  no new baselines; the visual specs stay Chromium-only. The CI Playwright image already ships both
  engines. Seven WebKit focus tests and one number-field wheel test are `test.fixme` on macOS only
  (macOS WebKit does not Tab-focus buttons and hit-tests the wheel against the element under the
  input; all pass in the Linux CI image). One Firefox test (popover `align=start` under a section
  `dir=rtl`) is `test.fixme` everywhere: Firefox resolves `self-*` position-area keywords against
  the top-layer containing block's writing mode. `PW_PORT` overrides the preview port (default 4173)
  so parallel worktrees can run Playwright side by side; the web server now has a 120s timeout and
  is only reused outside CI.

## 0.10.0 - 2026-11-11

- `benchlight/vue` now ships compiled JavaScript and `.d.ts` files (`dist/vue/`, one module per
  component, `vue` external) instead of raw `.vue` and `.ts` source. Consumers no longer need
  `@vitejs/plugin-vue` or a TypeScript-aware bundler to import it, and it has a `types` condition.
- `benchlight/nuxt` is compiled too (`dist/nuxt/module.mjs` and `module.d.mts`), so a consumer's
  `nuxt typecheck` no longer type-checks Benchlight source. The module registers the compiled
  components and auto-imports from `dist/vue`.
- `vue/` and `nuxt/` are no longer in the package. `dist/vue` and `dist/nuxt` are not committed:
  `prepack` builds them, so the npm tarball and the release tree always carry fresh copies. After a
  clone, run `bun run build:js` before the Nuxt tests or the fixtures.
- v0.10 adds four components and a shared placement vocabulary, all additive (no breaking change):
  BlPopover (disclosure panel on the native popover, trigger gets `aria-expanded` and
  `aria-controls`, panel has no role unless `ariaLabel` is set, then `role="group"`), BlTooltip
  (plain-text hint on hover and focus, Esc dismisses it before an enclosing dialog or popover,
  hover ignored for touch), BlTabs (WAI-ARIA tabs, panel slots are `panel-<value>`, `TabItem`
  describes an item) and BlNumberField
  (model is `number | null`, clamps to `[min, max]` on commit, not while typing or for externally
  set values; it does not block the mouse wheel, a focused field blurs on wheel, and it does not
  handle `form.reset()`).
  Popover and Tooltip share the `side` and `align` props (`PopoverSide`, `PopoverAlign`) and the
  `anchored` CSS module. A controlled-only `open` that ignores `update:open` still sees Esc and
  outside click close the native popover.
- Anchored placement needs CSS anchor positioning with `position-area`: Chromium 129, Safari 26,
  Firefox 147. Without it the Popover and Tooltip panel stays centred in the viewport and remains
  usable. Exit animations run in Chromium only; Safari and Firefox close instantly.

### Fixed

- Docs: README, the Vite plugin JSDoc and a test comment no longer say components ship as `.vue` and
  `.ts` source needing a compiler; the Vite and Nuxt notes match the compiled package.
- Docs: removed `paginationLabels.nav` (gone since 0.9); corrected the BlRadio attribute split, the
  BlTooltip `delay` default, the Tailwind breakpoint claim, and the CSS hooks table (added
  `--bl-anchored-gap`, `--bl-popover-width`, `--bl-tooltip-width`; `--bl-meter-value` is also set by
  BlProgress; scroll-offset defaults are literals).
- Docs: listed `data-side` and `data-align`, BlNumberField field wiring and `@row-activate`; added a
  browser-support section, a form-reset note and a note that link `href`/`to` are passed unchanged.
- The package `license` field is now `MIT AND OFL-1.1`, since the tarball ships OFL-1.1 fonts; LICENSE
  and README point at `fonts/OFL-*.txt`.
- The current item of BlSiteBarLink, BlTabBarItem and BlIndexRow now has a cue besides colour (an
  underline, or an inset bar) and a forced-colors fallback, so it no longer rests on hue alone.
- RTL: physical margins, padding, borders, `text-align` and `left`/`right` in prose, prev-next,
  index-row, section-head, meta, field, site-bar, skip-link and the appearance switch are logical
  now, and the appearance thumb and prev/next nudge mirror under `:dir(rtl)`. BlMarquee scrolls and
  masks the right way in RTL.
- The "!" error marks fall back to a plain `content` where alt text is unsupported. Anchored
  placement is gated on `position-area` support (Chrome 125 to 128 misplaced the panel), closed
  Popover and Tooltip panels stay hidden without `:popover-open`, and `BlTable` measuring no longer
  disables transitions on host cell content. `.bl-table--scroll` and the appearance track isolate
  their stacking, and the reduced-motion reset covers `.bl-dialog::backdrop`.
- BlDialog and BlPopover release their toast host, page lock and open state when a `KeepAlive`
  deactivates them, and BlDialog shows again on activation while `open` is still true.
- A toast `duration` of `Infinity`, `NaN`, zero or less now persists until dismissed, and values
  above 2^31-1 are clamped. BlPagination's range text agrees with its page count for a fractional or
  zero `pageSize`, and the ANSI parser drops cursor and erase sequences instead of printing them.
- Inside a BlField, BlInput, BlNumberField, BlSelect, BlRange and BlTextarea always use the field's
  id, so the label targets them; a different `id` on the control is ignored with a development
  warning. Set `id` on BlField instead. An unnamed BlSegmented or BlSegmentedNav warns in
  development, `isDev` no longer throws where `process` is undefined, and `rows`, `options` and
  `items` accept readonly arrays.
- Inline defaults of BlPopover, BlTooltip and BlSegmentedNav moved into `withDefaults`, so API.md
  lists them.
- Every `dist/modules/*.min.css` opens with `@layer theme, base, components, utilities;`, so loading
  any one module first no longer inverts the layer order. `bun run test` fails when it finds no
  tests and rebuilds a stale `dist/vue` and `dist/nuxt`.
- The release workflow no longer persists its write token in the checkout: it reaches only the git
  steps, per command, and never the install, check or fixtures steps. CI caches the bun install,
  pins the Playwright and actionlint images by digest and has weekly grouped Dependabot updates.
  happy-dom and vite are bumped for advisories (dev only).

## 0.9.0 - 2026-10-27

The v1 API freeze: one prop vocabulary, typed BlTable columns, one controlled-model rule and
prefixed names for everything Benchlight puts in a consumer's global scope (Nuxt auto-imports,
colour tokens, the Tailwind easing). Almost every change breaks, and none keeps an alias. Use the
table below to migrate; it is grouped by area.

### Migration

<!-- prettier-ignore -->
| Before | After |
| --- | --- |
| BlButton, BlLed `label` | `ariaLabel` (or the plain `aria-label` attribute) |
| BlLog, BlTabBar `label` | `ariaLabel` (or `aria-label`); same defaults |
| BlSiteBar `navLabel` | `ariaLabel` (or `aria-label`); it names the `<nav>` |
| BlPagination `label` and `labels.nav` | `ariaLabel` (or `aria-label`) |
| BlPrevNext `labels.nav` | `ariaLabel` (or `aria-label`) |
| BlToaster `labels.region` | `ariaLabel` (or `aria-label`) |
| BlPrevNext `as` | `linkAs` |
| BlIndexRow `current="true"` | `current` (`true` now renders `aria-current="page"`, not `"true"`) |
| BlSiteBarLink, BlTabBarItem, BlIndexRow `current` | `LinkCurrent`: `boolean \| 'page' \| 'step' \| 'location'`; `true` means `'page'` |
| `disabled` on BlInput, BlSelect, BlTextarea or BlRange | unchanged in templates; it is now a declared prop, so it is no longer in `$attrs` |
| BlMeter `label` with `showLabel` | `label` is always visible: drop `showLabel`; for a hidden name use `ariaLabel` instead of `label` |
| `<BlMeter :value="null">`, or BlMeter as a task bar | `<BlProgress :value="null">` / BlProgress (BlMeter now announces `role="meter"`) |
| BlMeter `:value` above 1 (for example `75`) | a 0 to 1 fraction; outside 0 to 1 (or `NaN`) it warns once in development and renders clamped |
| BlSegmented `label` | `ariaLabel`; `modelValue` still works, but it renders radios, not `aria-pressed` buttons |
| BlSegmented options with `to`, `href` or `current`, or BlSegmented `as` | BlSegmentedNav `items` (`as` → `linkAs`; an item's own `as` overrides `linkAs`) |
| `SegmentedOption` `to`, `href`, `current` | gone; `SegmentedOption` gains `disabled`, and links are `SegmentedNavItem` |
| `<BlMsg tone="info">`, `"ok"`, `"err"` | `tone="neutral"` (or omit), `"success"`, `"danger"`; the old values now render the neutral tone |
| BlNavLink | BlSiteBarLink (import and template; same props, slots and `bl-site-bar__link` class) |
| BlSectionHead root `<header class="bl-section-head">` | a `<div>`: select `.bl-section-head`, not `header.bl-section-head`, and give `heading` (or `eyebrow` with `bar`) a value. Host CSS that resets `div` margins (for example `.x > div`) now reaches it |
| BlTabBarItem `.bl-tab-bar__icon` with no `icon` slot | not rendered; target the item, not the empty span |
| a script `const columns = [...]` passed to BlTable, unannotated (inline template column literals are checked as they are) | annotate it `TableColumn<Row>[]`, or `as const satisfies readonly TableColumn<Row>[]` to type the cell slots |
| `interface X extends TableColumn<Row>` | `TableColumn<Row>` is now a union (`KeyColumn \| DerivedColumn \| SlotColumn`), so it cannot be extended; use an intersection: `type X = TableColumn<Row> & { … }` |
| BlTable `rowKey` as any string | a key of `Row` (or a function `(row) => string \| number`) |
| `{ key: 'actions', label: '' }` plus a `#cell-actions` slot | `{ key: 'actions', label: '', slot: true }` |
| a column whose `key` is not a row key, read via `sortBy` or `format(_, row)` | `{ key, value: (row) => … }` |
| `format: (value: unknown, row?: Row) => …` | `format: (value: Row[K], row: Row) => …` |
| `format` relied on to format a `total` | `formatTotal: (value, rows) => …`; without it totals render with `String()` |
| `total: (rows) => '3 bands'` (a string) | `total: (rows) => rows.length, formatTotal: (n) => n + ' bands'` |
| BlTable `paginationLabels.nav` | removed; its pagination is named by `labels.pages(caption)` |
| sort order following the runtime's locale | pass `locale` (for example `locale="lv"`); the default is `'en'` |
| BlTable resetting `page` to 1 while `rows` are empty | `page` is left alone until rows load, so a `?page=3` deep link survives an async load |
| BlPagination `page` past the last page | once `total > 0` it emits the clamped page (`update:page`); nothing while `total` is 0 |
| BlRange with no `v-model` showing `0` | it shows `min`; an out-of-range or off-step value is shown clamped and snapped, never emitted |
| BlDialog `:open` plus `@update:open` | unchanged; `open` is now a required `v-model:open`. BlDisclosure `open` works unbound (local state) |
| Nuxt auto-import `useToast` | `useBlToast`; or set `autoImports: { prefix: '' }` to keep every bare name |
| Nuxt auto-import `useAppearance` | `useBlAppearance` |
| Nuxt auto-import `useScrollLifted` | `useBlScrollLifted` |
| Nuxt auto-import `useReducedMotion` | `useBlReducedMotion` |
| Nuxt auto-import `useMarquee` | `useBlMarquee` |
| Nuxt auto-import `useFollowScroll` | `useBlFollowScroll` |
| Nuxt auto-import `riseDelay`, `ansiToSegments` | `blRiseDelay`, `blAnsiToSegments` |
| `var(--bl-trace)` (and `canvas`, `surface`, `raised`, `separator`, `control-border`, `ink-1`, `ink-2`, `ink-3`, `copper`, `phosphor`, `danger`) | `var(--bl-color-trace)` and so on; search for `--bl-` followed by one of those names |
| text on a trace or danger fill using `var(--bl-canvas)` or `var(--bl-raised)` | `var(--bl-color-on-trace)` / `var(--bl-color-on-danger)` |
| raw CSS `<button class="bl-segmented__item" aria-pressed="true">` | a radio group: `<label class="bl-segmented__item"><input type="radio" checked> …</label>`; or, for links, `<a class="bl-segmented__item" aria-current="page">` (BlSegmentedNav markup) |
| raw CSS `<div class="bl-meter" data-indeterminate>` | `class="bl-meter bl-meter--indeterminate"`; use `role="meter"` for a gauge |
| Tailwind `ease-out` expecting the Benchlight curve | `ease-bl`; `ease-out` is Tailwind's own again |

### Added

- BlProgress, the task readout (`role="progressbar"`, `value: number | null`, `null` for
  indeterminate), with BlMeter's props; both use the `meter` CSS module.
- BlSegmentedNav, a `<nav>` of links with `aria-current`, named by `ariaLabel`. `linkAs` sets the
  link component for every item, and a `SegmentedNavItem` may set its own `as`, which wins.
- BlTable slot-only columns (`slot: true`), derived columns (`value(row)`) and `formatTotal`.
- `--bl-color-on-trace` and `--bl-color-on-danger`: text and marks on a trace or danger fill
  (light `#ffffff`, dark the canvas colour, both at least 4.5:1). `benchlight/tokens` gains the
  two names.
- The Tailwind `ease-bl` utility, and `autoImports: { prefix }` in the Nuxt module.
- The `LinkCurrent` type.
- BlSegmented `name` (the radio group's `name`; a generated one by default).
- A development warning when BlMeter or BlProgress has no name (`label`, `ariaLabel` or
  `aria-labelledby`).

### Changed

- BlTable columns are typed from the row (generics `Row extends object` and
  `C extends TableColumn<Row>`, so interface rows compile). A column is a key column (`key` is a
  row key), a derived column (`value(row)`) or a slot-only column (`slot: true`). With literal
  columns, each `cell-<key>` slot's `value` follows its column's kind and unknown slot names fail
  type-checking.
- BlTable totals render through `formatTotal(value, rows)` (else `String()`), never `format`; a
  custom `total` function returns a number. Manual `totals` render as given.
- One prop vocabulary. `label` is only ever visible text; a name with no visible text is
  `ariaLabel` (the plain `aria-label` attribute maps to it and lands on the right element).
  BlPrevNext takes `linkAs` for its link component, `current` is `LinkCurrent` everywhere, and
  `disabled` is a declared prop on BlInput, BlSelect, BlTextarea and BlRange.
- One controlled-model rule: a component shows a corrected value but emits only what the user
  chose, except a page number that no longer exists once data has loaded. BlTable stops resetting
  `page` while it has no rows, BlPagination emits a clamped page once `total > 0`, BlRange's
  uncontrolled default is `min`, BlDialog's `open` is a required `v-model:open` and BlDisclosure
  works unbound.
- BlSegmented is a native radio group (`role="radiogroup"`, `v-model`, works unbound) and no
  longer renders links; link sets move to BlSegmentedNav.
- BlMeter is a gauge: `role="meter"`, `value: number`, no indeterminate state (a `null` passed at
  runtime renders as 0), and a dev warning when `value` is outside 0 to 1 (it renders clamped).
  The indeterminate bar is now `.bl-meter--indeterminate`, not `[data-indeterminate]`.
- The Nuxt module auto-imports composables and helpers with a `Bl` prefix (`useToast` →
  `useBlToast`, `riseDelay` → `blRiseDelay`), ending the clash with `@nuxt/ui`'s `useToast`.
  `autoImports` is now `boolean | { prefix?: string }`; `false` still turns them off,
  `{ prefix: 'Acme' }` renames them and `{ prefix: '' }` restores the bare names. Explicit imports
  from `benchlight/vue` keep their names.
- The default sort collator is `'en'`, not the runtime locale, so server and client agree.
- Every colour token moves under `--bl-color-*` (`--bl-trace` is now `--bl-color-trace`, and
  likewise `canvas`, `surface`, `raised`, `separator`, `control-border`, `ink-1`, `ink-2`,
  `ink-3`, `copper`, `phosphor`, `danger`). Tailwind utility names do not change, and
  `benchlight/tokens` is unchanged apart from the two new names. The on-colour tokens replace the
  canvas and raised colours components used on trace and danger fills.
- The Tailwind theme no longer overrides `ease-out`; the Benchlight curve is `ease-bl`.
- Small cleanups. BlMsg drops the pre-0.7 `info`, `ok` and `err` tones (and their dev warning);
  BlNavLink is renamed BlSiteBarLink, since it only works inside BlSiteBar's list (props, slots
  and CSS classes are unchanged); BlSectionHead renders a `<div>`, not a `<header>` (a `banner`
  landmark outside sectioning elements), and warns in development when its heading is empty;
  BlTabBarItem renders the icon span only when the `icon` slot has content.

## 0.8.1 - 2026-10-27

Non-breaking fixes from an audit of 0.8.0. Two behaviours change for the host app: under reduced
motion Benchlight no longer shortens the host's own animations, and it no longer forces
`scroll-behavior: auto` on `html`.

- Fix: `vite` peer range now includes `^8.0.0`; npm failed with ERESOLVE in a fresh Nuxt 4.6 app.
- Fix: `dist` no longer lowers `:dir(rtl)` to a `:lang(ar|he|...)` list, which put the toggle thumb and
  checkbox tick in the wrong place on `dir="rtl"` pages without an RTL `lang` (and the reverse).
- Fix: BlTable's focusable scroll region, sort buttons and row actions draw their focus ring inset,
  because `.bl-table` clipped the outside ring (WCAG 2.4.7).
- Added: BlMarquee pauses while hovered or while focus is inside it, and takes a `paused` prop
  (`useMarquee` takes a `paused` option) so overflowing text can be stopped (WCAG 2.2.2).
- Fix: the reduced-motion reset in `base` only targets `bl-` elements. It was `!important` on every
  element and overrode the host app's own animations, even its `!important` ones.
- Fix: `base` no longer sets `border-radius` on every focused element or removes the focus ring from
  `tabindex="-1"` elements, which changed the host app's own focus styles.

- Correction to 0.8.0: the package is not published on npm yet. The name `benchlight` is reserved with
  a `0.0.2` placeholder, and the README installs over git+ssh again (`#v0.8.0`). The components ship as
  `.vue` and `.ts` source, so a consumer needs Vite or Nuxt.

## 0.8.0 - 2026-10-26

Form controls and one validation convention, settled before the v1 API freeze, plus the npm-ready
package (MIT, explicit exports). Benchlight renders an invalid state it is given; it never decides
what is valid. Three changes break: the BlInput `type` narrowing (type-level only), the required
`invalid` member of `FieldContext` (type-level only) and the subpaths that are no longer
exported. Use the table below to migrate.

### Migration

<!-- prettier-ignore -->
| Before | After |
| --- | --- |
| `<BlInput type="number">`, `type="date"` and other non-text types | use a native `<input>` or a dedicated component; `number` is left out because the model is a string. Type-level only: any string still works at runtime |
| `provide(FIELD_CONTEXT, { id, describedBy })` | add `invalid: computed(() => false)`. Type-level only: at runtime the built-ins read `field?.invalid?.value === true`, so an older provider still works |
| `benchlight/dist/tokens.js` | `benchlight/tokens` |
| `benchlight/fonts/full/*`, `benchlight/fonts/OFL-*.txt`, `benchlight/js/prepaint-script.d.mts` | not exported any more (still in the package); use `benchlight/fonts/subset/*` and `benchlight/js/prepaint-script.mjs` |

### Added

- New components: BlTextarea (BlInput's multi-line sibling: no wrapper, every attr on the
  `<textarea>`, `rows` defaults to 4, vertical resize only, wired by BlField), BlCheckbox
  (`v-model` plus `v-model:indeterminate`; tick, dash and empty shapes), and BlRadioGroup with
  BlRadio (a `fieldset role="radiogroup"` with a `legend` that owns the model and the `name`;
  native arrow-key and Tab behaviour; `required`; `bl-fieldset--inline`).
- New CSS modules `checkbox`, `radio` and `fieldset` (`.bl-fieldset`, `__legend`, `__hint`,
  `__error`, `--invalid`, `--inline`), each with a `dist/modules/*.min.css`. `radio` needs
  `fieldset`; `fieldset` alone covers a CSS-only checkbox group (README recipe).
- Validation convention: an `error` string marks a control invalid and renders an error line
  with a leading "!" mark after the hint; the control gets `aria-invalid="true"` and the error id
  after the hint id in `aria-describedby`, and its border thickens, so the state never rests on
  colour. BlField carries it for BlInput, BlTextarea, BlSelect and BlRange; the self-labelled
  BlToggle, BlCheckbox and BlRadioGroup take their own `error` prop (`.bl-toggle__error`,
  `.bl-checkbox__error`, `.bl-fieldset__error`). A consumer `aria-invalid` wins. Errors are not
  live regions; add `role="alert"` where you want one announced.
- BlCheckbox and BlRadioGroup restore their mount-time value on a native form reset, as BlToggle
  does.

### Changed

- BlField takes an `error` prop. When set (a non-empty string) the field is invalid: it adds
  `.bl-field--invalid` and a `p.bl-field__error` after the hint, and BlInput, BlTextarea, BlSelect
  and BlRange set `aria-invalid="true"` and add the error id to `aria-describedby` (a consumer `aria-invalid`
  wins). The error is not a live region. The slot props gain `invalid`.
- `FieldContext` gains a required `invalid`, and `describedBy` is now the hint id then the error
  id. A provider written before this still works at runtime, because built-ins read `invalid`
  defensively; under TypeScript it must add `invalid` (see Migration).
- BlInput `type` is narrowed to `'text' | 'email' | 'password' | 'search' | 'tel' | 'url'`.
  Type-level only; any string still works at runtime (see Migration).
- The size cap on `dist/benchlight.min.css` is removed; the font subset cap stays.
- `package.json` is no longer `private`, and the README installs from npm (`npm install benchlight`).
- CI runs `publint` and `@arethetypeswrong/cli` (`bun run lint:package`) against the packed tarball.
- License is now MIT, with a `LICENSE` file; `package.json` gains `author`, `repository`,
  `homepage`, `bugs` and `engines` (Node 20 or newer), and a neutral description. `CHANGELOG.md`
  and `LICENSE` now ship in the package.
- `dist/tokens.js` is minified, like every other dist module.
- `package.json` lists every public path explicitly instead of the `./css/*`, `./js/*`, `./fonts/*`
  and `./dist/*` wildcards, and declares `sideEffects` so bundlers keep CSS and the appearance
  scripts. Not exported any more: `dist/tokens.js` (use `benchlight/tokens`),
  `js/prepaint-script.d.mts` as a subpath, `fonts/full/*` and `fonts/OFL-*.txt`. They still ship
  in the package. There is no root entry; import a subpath.
- Type-checks under stricter consumer settings: the shipped source passes with
  `exactOptionalPropertyTypes` and `noPropertyAccessFromIndexSignature`, both now on in the repo.
  Compiled runtime prop declarations are unchanged.
- New `LabelOverrides<T>` type; `labels` props take `Partial<LabelOverrides<…Labels>>` (was
  `Partial<…Labels>`), so an `undefined` label value, which falls back to the default, also
  type-checks under `exactOptionalPropertyTypes`. BlTable `rowLink` may return `undefined` link
  fields under that flag too.
- `benchlight/tokens` types come from a generated `dist/tokens.d.ts` instead of
  `tokens/index.ts`, so they resolve under `moduleResolution: "NodeNext"` too.

## 0.7.0 - 2026-10-09

The pre-v1 breaking batch: the last set of renames and attribute changes before the v1 API
freeze. Only BlMsg `tone` keeps old values (a dev warning, and a type error under vue-tsc);
everything else is a clean break. Use the table below to migrate.

### Migration

<!-- prettier-ignore -->
| Old | New |
| --- | --- |
| `<BlMsg tone="info">` | `tone="neutral"` or omit; warns until v1 (vue-tsc error) |
| `<BlMsg tone="ok">` | `tone="success"`; warns until v1 (vue-tsc error) |
| `<BlMsg tone="err">` | `tone="danger"`; warns until v1 (vue-tsc error) |
| `.bl-msg--ok` | `.bl-msg--success` (no alias) |
| `.bl-msg--err` | `.bl-msg--danger` (no alias) |
| `.bl-msg--info` | `.bl-msg` with no modifier |
| `.bl-msg` with no modifier (quiet note) | now carries the former info tint |
| BlIndexRow `selected` | `current` (`boolean \| 'page' \| 'step' \| 'location' \| 'true'`) |
| `.bl-index-row[aria-current='true']` | `[aria-current]:not([aria-current='false'])` |
| BlNavLink / BlIndexRow attrs and listeners but `class`/`style` on `<li>` | inner link/button |
| BlToaster `class`, `data-*`, `aria-*` (fell through) | its `<section>` |
| BlTable `aria-label`, `-labelledby`, `-describedby` etc. on wrapper | the `<table>` |
| BlField slot prop `describedby` | `describedBy` |
| BlInput, BlSelect, BlRange `aria-describedby` replaced the hint id | merged, hint first |
| BlRange props `id`, `ariaDescribedby` | plain attributes `id`, `aria-describedby` |
| BlSectionHead `#action` | `#actions` |
| `.bl-section-head__action` | `.bl-section-head__actions` |
| `--bl-col-min` | `--bl-table-col-min` |
| `TableLabels` objects typed in full | add `sortAscending`, `sortDescending`, `pages` |
| BlSegmented options with `to`/`href`, no `as` | links in a `<nav>`; drop `to`/`href` for buttons |
| `.bl-switch`, `__track`, `__option` | `.bl-appearance`, `__track`, `__option` |
| module `switch` (`switch.css`, `switch.min.css`) | module `appearance` (`appearance.css`, `appearance.min.css`) |
| `.bl-tabbar`, `__item`, `__icon`, `__label` | `.bl-tab-bar`, `__item`, `__icon`, `__label` |
| module `tabbar` (`tabbar.css`, `tabbar.min.css`) | module `tab-bar` (`tab-bar.css`, `tab-bar.min.css`) |

### Breaking

- BlMsg `tone` is now `'neutral' | 'success' | 'danger'`, matching toasts, BlLed and BlButton. The
  old `info`, `ok` and `err` props still work and map to `neutral`, `success` and `danger` with a
  one-time dev warning, until v1. The CSS classes have no alias: rename `bl-msg--ok` to
  `bl-msg--success` and `bl-msg--err` to `bl-msg--danger`. `bl-msg--info` is gone; neutral is the
  base `.bl-msg` with no modifier.

- BlIndexRow's `selected` prop is now `current?: boolean | 'page' | 'step' | 'location' | 'true'`,
  the name BlNavLink, BlTabBarItem and BlSegmented already use (`true` renders
  `aria-current="true"`; there is no `selected` alias). The current-item CSS in the site bar, tab
  bar, pagination, index row and segmented control now matches
  `[aria-current]:not([aria-current='false'])` instead of `='page'` or `='true'`, so
  `aria-current="location"` and `"step"` markup is styled everywhere. Rewrite CSS that targets
  `.bl-index-row[aria-current='true']` and similar to the new selector.

- Attributes now land on the element they describe. BlNavLink and BlIndexRow set
  `inheritAttrs: false`: `class` and `style` stay on the `<li>`; every other attribute and listener
  (`target`, `rel`, `aria-label`, `data-*`, `@click`) moves to the inner link or button, where it
  used to land on the `<li>`. BlToaster sets `inheritAttrs: false` and binds `class`, `data-*` and
  `aria-*` to its `<section>` (inside the teleport), which also removes the Vue extraneous-attrs
  warning; an `aria-label` there overrides the `labels.region` default. BlTable sends the naming,
  description and structure attributes (`aria-label`, `aria-labelledby`, `aria-describedby`,
  `aria-description`, `aria-details`, `aria-roledescription`, `aria-rowcount`, `aria-colcount`) to
  the `<table>` instead of the wrapper `div.bl-table`; `class`, `style`, `id`, `data-*`, listeners
  and state attributes such as `aria-hidden`, `aria-busy` and `aria-live` stay on the wrapper. A set
  `current` prop on BlNavLink or BlIndexRow wins over a consumer `aria-current`. Move any `target`,
  `rel` or `data-*` hook that targeted the `li`, and any `aria-*` the wrapper carried.

- Field controls settle on one description rule and one spelling. BlField's default slot prop
  `describedby` is now `describedBy`, matching `FIELD_CONTEXT`. BlInput, BlSelect and BlRange merge
  a consumer `aria-describedby` with the hint id (hint first, duplicates removed) instead of
  replacing it, as BlToggle already did. BlRange loses its `id` and `ariaDescribedby` props; pass
  `id` and `aria-describedby` as plain attributes, which still work and bind after the field
  context. Rename `describedby` in `#default` slot destructuring.

- Names that broke the naming pattern are renamed, with no aliases:
  - BlSectionHead's slot `action` is now `actions`, and its class `bl-section-head__action` is now
    `bl-section-head__actions`, matching BlSiteBar and BlColophon. Rename `#action` to `#actions`.
  - The per-column custom property `--bl-col-min` (BlTable sets it from `TableColumn.width`) is now
    `--bl-table-col-min`. The table-wide `--bl-table-min-col` is unchanged; both are in the README
    hooks table.
  - BlAppearanceSwitch's block `bl-switch` (`__track`, `__option`) is now `bl-appearance`; its
    module `switch` is now `appearance` (`css/components/appearance.css`,
    `dist/modules/appearance.min.css`).
  - BlTabBar and BlTabBarItem's block `bl-tabbar` (`__item`, `__icon`, `__label`) is now
    `bl-tab-bar`; the module `tabbar` is now `tab-bar` (`css/components/tab-bar.css`,
    `dist/modules/tab-bar.min.css`).

  Update hand-written markup, CSS overrides and per-module imports to the new names.

### Added

- Every built-in string is overridable. `AppearanceLabels.marks` (`{ auto, light, dark }`) sets the
  visible A / L / D marks of BlAppearanceSwitch. `TableLabels` gains `sortAscending` and
  `sortDescending` (the sort-strip state read by screen readers) and `pages: (caption) => string`
  (the default pagination name, still overridden by `paginationLabels.nav`).
- BlPagination's `label` is optional and falls back to `labels.nav`; a dev warning fires when
  neither is set.
- BlRange's slider carries the class `bl-range__input`; the `.bl-range input[type='range']` rule is
  kept.
- Exported types `StatusTone` (shared by BlMsg and `ToastTone`, now an alias), `ButtonVariant`,
  `LedState` and `DialogCloseEvent` (the payload of BlDialog's `close` event).
- API.md now records exported types (with shapes), every `--bl-*` token, BlTable's dynamic slot
  patterns and all slot props, script-set `data-*` attributes and the hook-only pagination classes.
- README: complete `data-*` list, one CSS hooks table, a component-to-module table and the list of
  supported entry points.

- BlLed takes an optional `label`: with it the LED is `role="img"` with that `aria-label`; without
  it, it stays `aria-hidden`.
- BlSpecRow and `SpecRowData` take `as` and `to` per `LinkProps`, so spec links can use a router
  component.
- Nuxt module option `autoImports` (default `true`); `false` skips the composable and helper
  auto-imports (such as `useToast`, which collides with Nuxt UI's) and keeps the components.
- BlToggle is uncontrolled-capable: `v-model` is optional (`defineModel<boolean>`), so a toggle in
  a plain form needs no dummy `:model-value`.

### Fixed

- BlSegmented switches to link mode when any option has `to` or `href`, not only when `as` is set;
  `as` then only picks the tag. Before, such options rendered buttons that ignored the link.
- BlToggle merges its hint id with a consumer `aria-describedby` through the shared helper, so ids
  are deduplicated as in BlInput, BlSelect and BlRange.
- A `labels` entry set to `undefined` now falls back to the default in BlAppearanceSwitch,
  BlPrevNext, BlDialog and BlToaster, as it already did in BlPagination and BlTable; before, it
  blanked the string. One internal `mergeLabels()` serves all six.

### Changed

- BlMedia declares its `as` (`'div'`) and `align` (`'start'`) defaults in `withDefaults`, so API.md
  shows them. Behaviour is unchanged.

## 0.6.2 - 2026-10-09

Overlay polish: toasts stay steady and visible while dialogs open and close, and a dialog closed and
reopened in the same task opens again. No breaking changes; the dialog's internal markup moved (see
below), and the documented CSS-only markup keeps working.

### Fixed

- BlDialog: a visible toast no longer slides or blinks when a dialog opens over it. The entry
  and exit fade and movement (`opacity`, plus `scale`, or `translate` for the bottom sheet)
  moved from `.bl-dialog` to `.bl-dialog__panel`; the dialog keeps only its `display`/`overlay`
  exit hold (Chromium) and the backdrop fade. The internal toast host is now a direct child of
  `<dialog>`, beside the panel, so the toaster is never transformed or faded with it. The panel
  may sit inside a wrapper such as `<form method="dialog">`.
- BlToast: toasts no longer dip under a closing dialog's backdrop for its ~200ms fade. The
  toaster still leaves the dialog as it starts closing (so a toast fired with the close is
  announced outside it), and while that dialog's exit transition runs it is shown as a
  `popover="manual"` above it in the top layer, then returns to normal stacking.
- BlDialog: setting `open` to false and back to true within one task now reopens the dialog.
  Before, the reopen was dropped because the browser's `close` event had not arrived yet, and
  the late event then emitted `update:open(false)`. The reopen now settles the closing session
  once (`close` with `'program'`, toast host, page lock, focus) and ignores its late event; the
  "known limitation" note is gone from the README.

## 0.6.1 - 2026-10-08

Motion release: exits that vanished now fade, state changes that snapped now ease, theme changes
crossfade, and hover styles no longer stick after a tap. No breaking changes.

### Fixed

- Theme changes from the appearance switch crossfade the whole page with a View Transition over
  `--bl-duration-base` where supported and motion is allowed; before, the page background faded
  while most surfaces snapped. Unsupported browsers and `auto` changes from the OS switch
  instantly, as before.
- BlToast: a dismissed toast now fades out where it stands. The move class that Vue puts on the
  leaving toast replaced its opacity and translate transitions, so it vanished at once while
  sliding unseen.
- BlLed eases its colour and glow between off, on and danger over `--bl-duration-fast`.
- BlEqBars: opacity eases with the height and colour, and stopping glides the bars to rest (a
  short composited animation from where the loop was) instead of snapping them back.
- BlTable: row hover and focus highlight and the sort icon's rotation and fade ease at
  `--bl-duration-fast`, like BlIndexRow and BlPrevNext; the icon is exempt from the measuring
  pass's `transition-property: none`, since it cannot change a measurement.
- BlPagination buttons ease their hover and current state, and BlButton its disabled opacity.
- BlToggle: the thumb slides with `translate` (mirrored for RTL with `:dir(rtl)`) instead of
  animating `inset-inline-start`.
- BlMeter: the fill eases over `--bl-duration-fast` with `--bl-ease-out` instead of 100ms linear.
- BlMarquee glides the text back to rest when it stops overflowing instead of snapping.
- `bl-page-*` fade with `ease` instead of `linear`.
- With reduced motion, `bl-rise` drops its stagger delay (items no longer wait invisible) and the
  BlPrevNext arrow no longer nudges on hover.
- BlPrevNext, BlTabBar, BlSiteBar, BlLinkArrow, BlColophon, BlSegmented, BlProse and BlSpecPanel hover styles apply only
  on hover-capable pointers, so a tap no longer leaves them highlighted.

### Changed

- The full-bundle size guard is raised from 53,248 B (52 KiB) to 56,320 B (55 KiB) for the motion
  fixes.

## 0.6.0 - 2026-10-08

Building-blocks release: BlToggle, BlMedia, BlDisclosure, BlDialog and BlToast (`useToast`), plus
icon-only, pressed and ghost buttons and visible meter labels. Per the README rule (changing a
component contract is breaking; minor bump while 0.x), this is a minor bump with one breaking item.

### Breaking

- BlSelect draws its chevron with theme tokens (`--bl-ink-2`, `--bl-ink-1` on hover) inside a
  `bl-select-wrap` span, 16px from the edge, instead of the browser's native arrow; the mask
  can be replaced with `--bl-chevron-mask`. `class` and `style` now land on the wrapper, so the
  component root is `span.bl-select-wrap` instead of `select`: style the control with
  `.x > .bl-select` or `:deep(.bl-select)`, and use `$el.querySelector('select')` where `$el` was
  the select. Listeners and other attributes still reach the `<select>`. A bare `.bl-select` is
  unchanged.

### Added

- BlButton: icon-only mode (`bl-btn--icon`, a 44px square, a circle with `pill`) when only the
  `icon` slot is filled; `label` sets `aria-label`; `pressed` renders `aria-pressed` on buttons;
  `variant="ghost"` (`bl-btn--ghost`).
- BlMeter: `valueText` (`aria-valuetext`), `showLabel` and `showValue` render the label and value
  visibly in a `bl-meter-field` wrapper; without them the markup is unchanged.
- BlToggle: an on/off switch on a native checkbox (`role="switch"`), with hint, form posting and RTL.
- BlMedia: a figure beside a body with an optional aside; wraps intrinsically when narrow.
- BlDisclosure: a collapsible section on native `<details>`, with exclusive groups via `name`.
- BlDialog: a modal on native `<dialog>`, centred from 40em and a bottom sheet below, with close
  reasons, focus restore and a scroll lock.
- BlToaster and `useToast()`: queued toasts with tones, actions, pause on hover or focus,
  screen-reader announcements, and in-dialog rendering while a modal is open.

### Changed

- The full-bundle size guard is raised from 38,912 B (38 KiB) to 53,248 B (52 KiB) for the v0.6
  components and the button, meter and select chevron additions.
- Button hover rules now apply only inside `@media (hover: hover)`.

### Fixed

- Input and select hover borders apply only on hover-capable pointers.
- The BlSiteBar nav edge fade also ships `-webkit-mask-image`, so Chromium before 120 fades the
  nav edges instead of showing them hard-cut.
- Library scrollers (`.bl-log`, BlTable scroll mode, prose tables) use a thin scrollbar with a
  `--bl-control-border` thumb on a transparent track instead of the browser's default grey one. The
  page scrollbar and app scrollers inherit the same colours from `base` (default width).
  A 1px `--bl-separator` edge marks a classic page scrollbar, like the native track border; it
  is absent with overlay scrollbars, when `html` reserves the gutter (`overflow-y: scroll`,
  `scrollbar-gutter: stable`) and in RTL documents, and only exists where `scrollbar-color` is
  supported. `base` now uses `html::after` for it; reset it with `html::after { content: none }`.
- A stacked BlTable no longer jumps in height for one frame under reduced motion when a parent
  re-render (a new `rows` array) makes it re-measure.

## 0.5.0 - 2026-10-06

Tables release: BlTable and BlPagination. No breaking changes.

### Added

- BlTable: `columns` + `rows` props, built-in sorting (`v-model:sort`, `locale` collation), and
  measured stacking into cards when the table does not fit its container (`--bl-table-min-col`,
  default 8rem; a "Sort by" strip replaces the headers while stacked). `scroll` mode scrolls
  horizontally with a sticky first column instead of stacking.
- BlTable paging (`pageSize`, `v-model:page`), `manual` mode for server-side sorting and paging
  (`totalRows`, `totals`), row actions (`rowLink` or `@row-activate`, with a whole-row click
  forwarder) and a totals footer (column `total`: `'sum'`, `'avg'`, `'count'` or a function).
- BlPagination: standalone or inside BlTable, with a compact layout on narrow screens and a polite
  live region for the visible range.
- `table` and `pagination` CSS modules with a CSS-only class contract; `data-fit`, `data-stacked`
  and `data-measuring` join the script-set attributes.
- `REQUIRES` in the module map: the bundle CLI warns when a selected module needs another one
  (`table` needs `layout` and `pagination`; `pagination` needs `layout`).
- Tests ban `container-type` and `@container` in library CSS.
- Stress cases for wide, long-text, scroll, paged, totals and action tables, including tables in
  flex, inline and grid hosts.

### Changed

- Full-bundle guard raised from 32,768 to 38,912 bytes.

## 0.4.0 - 2026-10-04

Responsiveness release. Layouts size by available space instead of viewport width, long content wraps,
and the site bar, tab bar and iOS safe areas hold up at any width. Per the README rule (removing a class
or custom property, or changing a component contract, is breaking; minor bump while 0.x), this is a
minor bump with two breaking items.

### Breaking

- The `.bl-meta__sep` element is removed. BlMeta `separator` now adds `.bl-meta--sep` and draws the
  dashes with `.bl-meta--sep > * + *::before`. Raw-CSS users who wrote the separator element by hand
  should add `bl-meta--sep` to the container and drop the element.
- `--bl-telemetry-columns` now applies at every width; it used to apply only from 640px. A value set
  for desktop now also governs phones, so wrap it in your own media query for the old behaviour. The
  default is auto-fit with 12rem cells; with no custom columns, six cells lay out 3x2 when there is
  room.

### Added

- `xs` breakpoint token (30em / 480px).
- `--bl-range-value-width` (default 56px) reserves room for the BlRange value so the track does not
  change length while dragging.
- `.bl-msg__text`: BlMsg wraps its slot in it. Raw-CSS users should wrap message text in it.
- Telemetry dividers survive forced-colors mode.
- Safe-area insets for the fixed bars, body padding, scroll offsets and `.bl-col` (needs
  `viewport-fit=cover` in the page's viewport meta).
- Stress suite: `/stress.html` in the playground and `tests/visual/stress.spec.ts` (11 widths from
  320 to 1920, 200% text, a 280px container; `STRESS_BREAK` proves the checks bite).

### Changed

- Media queries use `em` (sm 40em, xs 30em) so they follow the user's font size. The `md`, `lg` and
  `xl` tokens are unchanged and still unused by the library CSS.
- BlPrevNext titles wrap instead of truncating, and the grid shrinks to fit.
- BlSpecPanel rows and BlColophon wrap; the colophon is left-aligned when narrow.
- Display sizes are smaller on phones (`xl` is 40px at 320px wide); maximums are unchanged.
- Link arrows have a 44px minimum width; their hit area no longer overhangs horizontally.
- BlLog text and default height are in rem (12.5rem); long lines break only where they would
  overflow.
- `.bl-prose` measure is `min(720px, 68ch)`, ordered lists indent 1.75em, and images, video, iframes
  and tables are capped to the column (tables scroll horizontally).
- Site-bar controls have a negative `scroll-margin`: `scrollIntoView()` or a `#hash` aimed at one
  lands up to about 34px off. Target page content instead.
- Full-bundle guard raised from 28,672 to 32,768 bytes.

### Fixed

- Page-wide overflow from long URLs, hashes and compound words (BlReadout widened the page by 541px
  at 320px): readout, button, field label and hint, segmented, link arrow, colophon, index row, meta,
  section head, telemetry and spec row now wrap.
- BlPrevNext: a long title no longer widens the page at any width.
- BlSiteBar: six or more links, long labels or a long brand no longer push the page sideways. The nav
  scrolls on one line with an edge fade and focus rings intact; short brands never truncate, long
  ones ellipsise; the appearance switch never moves and is vertically centred; logo brands are
  vertically centred. Below 40em the nav stays visible unless a tab bar replaces it. Focusing a nav
  link scrolls only the nav, never the page. The bar is static on screens under 30em tall.
- BlTabBar: items shrink and ellipsise (5 tabs maximum) with 44px targets.
- BlMsg: links and code no longer split the message into flex columns.
- BlRange: keeps a 96px track.
- BlSegmented: wrapped rows no longer steal taps from each other; the control rounds to 17px;
  compact items keep 44px targets.
- BlMeta: a wrapped line never ends on a dash.
- BlMarquee (`useMarquee`): re-measures on container, content and font changes; with reduced motion,
  overflowing text wraps instead of hiding.
- BlIndexRow: hover styles apply only on hover-capable pointers, so a tap never leaves a row
  highlighted.
- BlSectionHead: the heading keeps its column when the action is long.
- Inputs and selects are 16px on coarse pointers, so iOS does not zoom on focus.

## 0.3.0 - 2026-10-04

Accessibility, packaging and CI release. Per the README rule (removing a custom property or changing
a component contract is breaking, minor bump while 0.x), this is a minor bump with two breaking items.

### Breaking

- `--bl-font-sans-features` is removed (Geist has no cvXX features). Delete any use of it.
- BlRange forwards fallthrough attrs (`aria-label`, `disabled`, `name`, listeners) to the slider
  instead of the wrapper; `class` and `style` stay on the wrapper. Explicit `ariaDescribedby` and
  `id` props still win over the field context.

### Added

- `--bl-control-border` token (at least 3:1 against canvas, surface and raised in both themes), with
  the `border-control-border` Tailwind utility; non-text contrast is tested.
- Forced-colors support: LEDs, meter fill, EQ bars, the ok dot and the selected segment stay visible.
- BlLog `offset` prop (absolute index of `lines[0]`) so a capped buffer reuses rows.
- `dist/appearance.min.js` for pages that inline the switch script.
- `PREPAINT` and `PREPAINT_CSP_HASH` from `benchlight/js/prepaint-script.mjs` for strict CSP.
- The bundle CLI warns when selected modules need `type` or `base` and they are missing.
- `bun run lint:workflows` (actionlint) and unit tests for the Nuxt module and Vite plugin.

### Changed

- Release tags are slim: pushing `src-vX.Y.Z` makes CI commit exactly the `bun pm pack` contents
  to the `release` branch and tag it `vX.Y.Z`. The installed package no longer contains tests,
  fixtures, the playground or screenshots. Consumer URLs are unchanged. Tags up to v0.2.1 are
  full-tree source tags.
- The appearance switch is 24px wider (44px options); link arrows, colophon links and segmented
  items get 44px hit areas.
- BlPrevNext renders nothing when it has no neighbours.
- Arrows in BlLinkArrow and BlPrevNext are inline SVG; the icon slot override is unchanged.
- Geist and Geist Mono subsets add section sign, copyright, en dash, right single quote and
  ellipsis and keep Geist's kerning. The subset cap is raised from 22,528 to 23,552 bytes (now
  22,840).
- Full-bundle guard raised from 27,648 to 28,672 bytes (now 28,165).
- Firefox target raised to 121 (`:has()`); links underline on hover instead of fading below AA.
- BlSiteBar `lift` is reactive; `useScrollLifted` accepts a ref or getter.
- `LinkTo` accepts any object, so typed router locations pass.
- The Nuxt module and Vite plugin import the generated `js/prepaint-script.mjs`, so consumers no
  longer need `@types/node` (`nuxi typecheck` passes). The vite peer range is `^6 || ^7`.
- bun 1.4.2 is required (`packageManager`): bun 1.2.x passes a malformed `-c` option to `git clone`
  on Linux, so git installs of Benchlight fail there. Consumers installing from git need 1.4.2+.
- CI: least-privilege permissions, SHA-pinned actions, one bun version via `packageManager`,
  actionlint. The deploy key is used only through `GIT_SSH_COMMAND`; the README shows the same
  pattern for consumers.

### Fixed

- Radio-label segmented items show the focus ring on keyboard focus.
- `.bl-prose` keeps ordered lists and h4-h6 styling under Tailwind's preflight; the focus ring
  outranks Firefox's `:-moz-focusring`.
- The appearance switch no longer slides after hydration.
- Uncoloured BlLog segments no longer emit `class=""`.

## 0.2.1 - 2026-10-03

### Fixed

- BlButton, BlIndexRow, BlLinkArrow, BlNavLink and BlTabBarItem failed to compile in apps
  without TypeScript installed (v0.2.0 regression: imported props type). Props are inline again.
- Meta text on a selected BlIndexRow uses `ink-2`; `ink-3` on the selected tint measured
  4.05:1 in light mode, under WCAG AA.

### Changed

- CI runs the Playwright axe, keyboard and screenshot checks on Linux, with per-platform
  screenshot baselines (`*-darwin.png`, `*-linux.png`).
- CI installs Benchlight over SSH with a read-only deploy key (`BENCHLIGHT_DEPLOY_KEY`)
  instead of the never-set `BENCHLIGHT_TOKEN`; the README shows the same setup for consumers.

## 0.2.0 - 2026-10-03

Accessibility and contract release, from six audits of v0.1.

### Breaking

- BlSegmented links mode renders `<nav aria-label>` and marks the current link
  `aria-current="page"` (was a role-less `<div>` with `aria-current="true"`).
- BlLog drops `aria-live` (implied by `role="log"`), gains `tabindex="0"` and a `label`
  prop, and only follows new lines while the reader is at the bottom.
- A disabled BlButton that renders a link becomes a plain `<a>` without `href`/`to`,
  with `tabindex="-1"` and cancelled clicks.

### Added

- `useFollowScroll` composable (also auto-imported in Nuxt). An enabled follower starts at the
  bottom on mount, and `pinned` is truthful from mount.
- `FIELD_CONTEXT`: BlField wires `id` and `aria-describedby` into BlInput, BlSelect and BlRange.
  BlRange gains an `ariaDescribedby` prop, because its attrs fall through to the wrapper rather
  than the input.
- `LinkProps` type, one tag rule for link components, and dev warnings for link misuse.
- Indeterminate BlMeter (`value: null`).
- `--bl-scroll-offset-top` / `--bl-scroll-offset-bottom` hooks; scroll padding keeps focus
  clear of the sticky site bar and the mobile tab bar.
- Generated `API.md` with a freshness test, and a Nuxt auto-import coverage test.
- Browser checks: axe (0 violations), keyboard log scrolling, skip-link focus, focus not
  obscured on mobile.

### Changed

- The size guard for `dist/benchlight.min.css` is raised from 25,600 to 27,648 bytes; the
  full bundle is now 26,271 bytes.

### Fixed

- `useFollowScroll` rebinds when its element changes.
- Indeterminate BlMeter shows a full bar under reduced motion.
- Programmatic focus targets (`tabindex="-1"`) no longer draw a focus ring.
- BlSectionHead renders its `action` slot outside bar mode.
- BlSpecRow opens only absolute and protocol-relative links in a new tab; rows can set `external`.

## 0.1.0 - 2026-10-03

First release of Benchlight as a library.

- Tokens: 11 colours in light and dark (adds `danger`), named type scale, shape, layout, motion
  and elevation, generated into `css/tokens.css` and a Tailwind v4 theme.
- Plain CSS: foundations plus 23 components, prefixed `bl-`, in cascade layers.
- Vanilla `prepaint.js` and `appearance.js` for static pages.
- 31 `Bl*` Vue components and the `useAppearance`, `useScrollLifted`, `useReducedMotion`,
  `useMarquee`, `riseDelay` and `ansiToSegments` helpers.
- `benchlight/nuxt` module and `benchlight/vite` plugin.
- Self-hosted Geist, Geist Mono and Bricolage Grotesque (pinned), plus compact subsets.
- Minified `dist/benchlight.min.css`, `dist/modules/*.min.css` and `dist/fonts.min.css`, and a
  custom-build CLI with optional static-token inlining.
- Appearance moved to `data-bl-appearance` / `bl-appearance`; saved choices from the old
  `appearance` key are not migrated.

### Fixed (after the release commit, before the tag)

- BlLog keeps following appended lines.
- Appearance state is shared across `useAppearance` instances.
- BlSiteBar wraps its nav in a landmark.
- Geist feature settings are carried through Tailwind's preflight.
- Small hit areas are widened.
- Each appearance switch gets its own radio group.
- The bundle keeps only hand-written vendor prefixes.

The project was renamed from kdesign to benchlight in the last commit before the tag.
