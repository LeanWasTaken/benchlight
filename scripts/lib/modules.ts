// Every CSS module in cascade order. css/index.css imports exactly these, in this order
// (tests/css-conventions.test.ts), and scripts/lib/bundle.ts builds dist/ from them.
export const MODULES = {
  tokens: 'css/tokens.css',
  base: 'css/base.css',
  type: 'css/type.css',
  motion: 'css/motion.css',
  layout: 'css/layout.css',
  tints: 'css/tints.css',
  'site-bar': 'css/components/site-bar.css',
  'tab-bar': 'css/components/tab-bar.css',
  colophon: 'css/components/colophon.css',
  'skip-link': 'css/components/skip-link.css',
  appearance: 'css/components/appearance.css',
  segmented: 'css/components/segmented.css',
  btn: 'css/components/btn.css',
  field: 'css/components/field.css',
  fieldset: 'css/components/fieldset.css',
  'link-arrow': 'css/components/link-arrow.css',
  'spec-panel': 'css/components/spec-panel.css',
  telemetry: 'css/components/telemetry.css',
  led: 'css/components/led.css',
  eq: 'css/components/eq.css',
  marquee: 'css/components/marquee.css',
  readout: 'css/components/readout.css',
  meter: 'css/components/meter.css',
  msg: 'css/components/msg.css',
  log: 'css/components/log.css',
  'section-head': 'css/components/section-head.css',
  meta: 'css/components/meta.css',
  'index-row': 'css/components/index-row.css',
  'prev-next': 'css/components/prev-next.css',
  prose: 'css/components/prose.css',
  table: 'css/components/table.css',
  pagination: 'css/components/pagination.css',
  toggle: 'css/components/toggle.css',
  checkbox: 'css/components/checkbox.css',
  radio: 'css/components/radio.css',
  media: 'css/components/media.css',
  disclosure: 'css/components/disclosure.css',
  dialog: 'css/components/dialog.css',
  lightbox: 'css/components/lightbox.css',
  toast: 'css/components/toast.css',
  anchored: 'css/components/anchored.css',
  popover: 'css/components/popover.css',
  tooltip: 'css/components/tooltip.css',
  tabs: 'css/components/tabs.css',
  'number-field': 'css/components/number-field.css'
} as const

export type ModuleName = keyof typeof MODULES

// Component-to-component requirements the bundle CLI warns about when a module is selected
// without them (CSS-derived `type`/`base` needs are detected separately in bundle.ts).
export const REQUIRES: Partial<Record<ModuleName, readonly ModuleName[]>> = {
  dialog: ['btn'],
  lightbox: ['btn', 'layout'],
  'number-field': ['field'],
  pagination: ['layout'],
  popover: ['anchored'],
  radio: ['fieldset'],
  table: ['layout', 'pagination'],
  toast: ['btn', 'layout'],
  tooltip: ['anchored']
}
