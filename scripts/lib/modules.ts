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
  'link-arrow': 'css/components/link-arrow.css'
} as const

export type ModuleName = keyof typeof MODULES
