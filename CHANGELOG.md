# Changelog

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
