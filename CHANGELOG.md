# Changelog

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
