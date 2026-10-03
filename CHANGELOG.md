# Changelog

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
