# Changelog

## Unreleased

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
