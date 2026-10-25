import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Features, transform } from 'lightningcss'
import { tokens } from '../../tokens/tokens'
import { MODULES, REQUIRES, type ModuleName } from './modules'
import { staticVars } from './render-tokens'

// The source's browser floor: color-mix() sets Chrome 111 and Safari 16.2, :has() sets Firefox 121.
// The marquee's @property needs Firefox 128; older Firefox skips it and the mask just does not animate.
const TARGETS = { safari: (16 << 16) | (2 << 8), chrome: 111 << 16, firefox: 121 << 16 }

export function minifyCss(code: string, filename: string): string {
  const result = transform({
    filename,
    code: Buffer.from(code),
    minify: true,
    targets: TARGETS,
    // light-dark() is never used, so its --lightningcss-* fallback helpers would be dead weight.
    exclude: Features.VendorPrefixes | Features.LightDark
  })
  return Buffer.from(result.code).toString('utf8')
}

// A non-colour token is inlined when its literal is shorter than its var() reference;
// colours never are, because they change with the appearance (spec §5).
export function inlinableVars(): Array<[string, string]> {
  return staticVars(tokens).filter(([name, value]) => value.length < `var(${name})`.length)
}

export function inlineStaticTokens(css: string, vars: Array<[string, string]>): string {
  let out = css
  for (const [name, value] of vars) {
    out = out.split(`var(${name})`).join(value)
    out = out.replace(new RegExp(`^[ \\t]*${name}: [^;]*;\\n`, 'gm'), '')
    if (out.includes(`var(${name},`)) {
      throw new Error(`${name} is used with a fallback and cannot be inlined`)
    }
  }
  return out
}

const LAYER_ORDER = '@layer theme,base,components,utilities;'

// lightningcss collapses the layer-order statement; restore it ahead of the tokens.
function withLayerOrder(css: string): string {
  return LAYER_ORDER + css.replace(/^@layer [\w-]+(?:,[\w-]+)*;/, '')
}

export function buildModules(
  names: readonly ModuleName[],
  root: string,
  { inlineStatic }: { inlineStatic: boolean }
): { bundle: string; modules: Record<string, string> } {
  const vars = inlineStatic ? inlinableVars() : []
  const sources = names.map((name) => {
    const css = readFileSync(join(root, MODULES[name]), 'utf8')
    return [name, inlineStaticTokens(css, vars)] as const
  })
  const modules: Record<string, string> = {}
  for (const [name, css] of sources) modules[name] = minifyCss(css, `${name}.css`)
  let bundle = minifyCss(sources.map(([, css]) => css).join('\n'), 'bundle.css')
  if (names.includes('tokens')) {
    bundle = withLayerOrder(bundle)
    modules['tokens'] = withLayerOrder(modules['tokens']!)
  }
  return { bundle, modules }
}

export function buildDist(root: string): {
  bundle: string
  modules: Record<string, string>
  fonts: string
} {
  const { bundle, modules } = buildModules(Object.keys(MODULES) as ModuleName[], root, {
    inlineStatic: false
  })
  // dist/ sits at the same depth as css/, so fonts.css's relative url()s stay valid.
  const fonts = minifyCss(readFileSync(join(root, 'css/fonts.css'), 'utf8'), 'fonts.css')
  return { bundle, modules, fonts }
}

// Returns the paths written, relative to root.
export function writeDist(root: string): string[] {
  const { bundle, modules, fonts } = buildDist(root)
  const dir = join(root, 'dist/modules')
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const written: Array<[string, string]> = [
    ['dist/benchlight.min.css', bundle],
    ['dist/fonts.min.css', fonts],
    ...Object.entries(modules).map(([name, css]): [string, string] => [
      `dist/modules/${name}.min.css`,
      css
    ])
  ]
  for (const [path, css] of written) writeFileSync(join(root, path), css)
  return written.map(([path]) => path)
}

// Foundations a component module silently relies on. `type` styles the component parts it
// lists (.bl-field__label, .bl-meta ...), so a module whose CSS names one of those blocks
// needs it; `base` holds the reduced-motion rule, which every animated module without its
// own needs. Both are derived from the CSS, so new modules are covered without upkeep.
const blocks = (css: string): Set<string> =>
  new Set(
    [...css.matchAll(/\.(bl-[a-z0-9]+(?:-[a-z0-9]+)*?)(?=__|--|[^a-z0-9_-]|$)/g)].map((m) => m[1]!)
  )

export function missingFoundations(
  names: readonly ModuleName[],
  root: string,
  requires: Partial<Record<ModuleName, readonly ModuleName[]>> = REQUIRES
): string[] {
  const read = (name: ModuleName) => readFileSync(join(root, MODULES[name]), 'utf8')
  const typeBlocks = blocks(read('type'))
  const messages: string[] = []
  for (const name of names) {
    if (name === 'tokens' || name === 'base' || name === 'type') continue
    const css = read(name)
    if (!names.includes('type') && [...blocks(css)].some((block) => typeBlocks.has(block))) {
      messages.push(`${name} needs type (its type voices live in css/type.css)`)
    }
    if (
      !names.includes('base') &&
      /animation/.test(css) &&
      !css.includes('prefers-reduced-motion')
    ) {
      messages.push(`${name} needs base (its reduced-motion rule lives in css/base.css)`)
    }
  }
  for (const name of names) {
    for (const dep of requires[name] ?? []) {
      if (!names.includes(dep)) messages.push(`${name} needs ${dep}`)
    }
  }
  return messages
}
