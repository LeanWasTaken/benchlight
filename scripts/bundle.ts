import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { buildModules, writeDist } from './lib/bundle'
import { MODULES, type ModuleName } from './lib/modules'

const USAGE = `usage:
  bun scripts/bundle.ts
      Writes the minified dist/: kdesign.min.css, fonts.min.css and modules/<name>.min.css.
  bun scripts/bundle.ts --modules a,b,c --out <file> [--inline-static]
      Writes a custom minified build of the listed modules, in the order given.
      --inline-static substitutes short static tokens and omits their declarations from the
      tokens module, so such a build is self-contained and must not be mixed with the
      unminified source CSS.`

function fail(message: string): never {
  console.error(`${message}\n\n${USAGE}`)
  process.exit(1)
}

const root = join(import.meta.dir, '..')
const { values } = parseArgs({
  options: {
    modules: { type: 'string' },
    out: { type: 'string' },
    'inline-static': { type: 'boolean', default: false }
  }
})

if (values.modules === undefined) {
  if (values.out !== undefined) fail('--out needs --modules')
  if (values['inline-static']) fail('--inline-static needs --modules')
  for (const path of writeDist(root)) {
    console.log(`wrote ${path} (${readFileSync(join(root, path)).byteLength} bytes)`)
  }
} else {
  const names = values.modules
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
  if (names.length === 0) fail('--modules is empty')
  if (!values.out) fail('--modules needs --out <file>')
  for (const name of names) if (!(name in MODULES)) fail(`unknown module: ${name}`)
  const { bundle } = buildModules(names as ModuleName[], root, {
    inlineStatic: values['inline-static']
  })
  writeFileSync(values.out, bundle)
  console.log(`wrote ${values.out} (${Buffer.byteLength(bundle)} bytes)`)
}
