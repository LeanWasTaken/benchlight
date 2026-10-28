import { $ } from 'bun'
import { renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const out = join(root, 'dist', 'nuxt')

rmSync(out, { recursive: true, force: true })

// Run after build-vue: dist/vue/components.json is inlined into the module.
const result = await Bun.build({
  entrypoints: [join(root, 'nuxt', 'module.ts')],
  outdir: out,
  target: 'node',
  format: 'esm',
  external: ['@nuxt/kit', '@nuxt/schema'],
  naming: 'module.mjs'
})
if (!result.success) throw new Error(result.logs.join('\n'))

await $`bunx tsc -p nuxt/tsconfig.build.json`.cwd(root)
renameSync(join(out, 'module.d.ts'), join(out, 'module.d.mts'))
