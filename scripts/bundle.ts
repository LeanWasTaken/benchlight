import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { buildModules, writePreset } from './lib/bundle'
import { MODULES, PRESETS, type ModuleName, type PresetName } from './lib/modules'

const root = join(import.meta.dir, '..')
const { values } = parseArgs({
  options: {
    preset: { type: 'string' },
    modules: { type: 'string' },
    out: { type: 'string' },
    'inline-static': { type: 'boolean', default: false }
  }
})

if (values.modules) {
  if (!values.out) throw new Error('--modules needs --out <file>')
  const names = values.modules.split(',').map((name) => name.trim())
  for (const name of names) if (!(name in MODULES)) throw new Error(`unknown module: ${name}`)
  const { bundle } = buildModules(names as ModuleName[], root, {
    inlineStatic: values['inline-static'] ?? false
  })
  writeFileSync(values.out, bundle)
  console.log(`wrote ${values.out} (${Buffer.byteLength(bundle)} bytes)`)
} else {
  const presets = values.preset ? [values.preset] : Object.keys(PRESETS)
  for (const preset of presets) {
    if (!(preset in PRESETS)) throw new Error(`unknown preset: ${preset}`)
    writePreset(preset as PresetName, root)
    console.log(`wrote dist/${preset}.min.css and dist/${preset}/`)
  }
}
