// Every CSS module in cascade order. css/index.css imports exactly these, in this order
// (tests/css-conventions.test.ts), and scripts/lib/bundle.ts builds presets from them.
export const MODULES = {
  tokens: 'css/tokens.css',
  base: 'css/base.css',
  type: 'css/type.css',
  motion: 'css/motion.css',
  layout: 'css/layout.css',
  tints: 'css/tints.css'
} as const

export type ModuleName = keyof typeof MODULES
