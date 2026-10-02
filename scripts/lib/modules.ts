// Every CSS module in cascade order. css/index.css imports exactly these, in this order
// (tests/css-conventions.test.ts), and scripts/lib/bundle.ts builds presets from them.
export const MODULES = {
  tokens: 'css/tokens.css',
  base: 'css/base.css',
  type: 'css/type.css',
  motion: 'css/motion.css',
  layout: 'css/layout.css',
  tints: 'css/tints.css',
  'site-bar': 'css/components/site-bar.css',
  tabbar: 'css/components/tabbar.css',
  colophon: 'css/components/colophon.css',
  'skip-link': 'css/components/skip-link.css',
  switch: 'css/components/switch.css',
  segmented: 'css/components/segmented.css',
  btn: 'css/components/btn.css',
  field: 'css/components/field.css',
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
  prose: 'css/components/prose.css'
} as const

export type ModuleName = keyof typeof MODULES

// Presets ship as dist/<preset>.min.css plus dist/<preset>/<module>.min.css.
// "device" is the size-budgeted preset for static pages.
export const PRESETS = {
  device: [
    'tokens',
    'base',
    'type',
    'motion',
    'layout',
    'tints',
    'site-bar',
    'tabbar',
    'colophon',
    'switch',
    'segmented',
    'btn',
    'field',
    'link-arrow',
    'spec-panel',
    'telemetry',
    'led',
    'readout',
    'meter',
    'msg',
    'log',
    'section-head',
    'meta'
  ]
} as const satisfies Record<string, readonly ModuleName[]>

export type PresetName = keyof typeof PRESETS
