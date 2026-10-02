import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { transform } from 'lightningcss'
import { tokens } from '../../tokens/tokens'
import { MODULES, PRESETS, type ModuleName, type PresetName } from './modules'
import { staticVars } from './render-tokens'

export function minifyCss(code: string, filename: string): string {
  const result = transform({ filename, code: Buffer.from(code), minify: true })
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
    out = out.replace(new RegExp(`^\\s*${name}: [^;]*;\\n`, 'm'), '')
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
    modules.tokens = withLayerOrder(modules.tokens!)
  }
  return { bundle, modules }
}

export function buildPreset(name: PresetName, root: string) {
  return buildModules(PRESETS[name], root, { inlineStatic: name === 'device' })
}

export function writePreset(name: PresetName, root: string): void {
  const { bundle, modules } = buildPreset(name, root)
  const dir = join(root, 'dist', name)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(root, 'dist', `${name}.min.css`), bundle)
  for (const [module, css] of Object.entries(modules)) {
    writeFileSync(join(dir, `${module}.min.css`), css)
  }
}
