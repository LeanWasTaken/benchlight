# Changelog

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
