import vue from '@vitejs/plugin-vue'
import { $ } from 'bun'
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'vite'

const root = join(import.meta.dir, '..')
const out = join(root, 'dist', 'vue')

rmSync(out, { recursive: true, force: true })

// One module per source file, so a consumer's bundler tree-shakes at component granularity.
await build({
  root,
  configFile: false,
  logLevel: 'warn',
  plugins: [vue()],
  build: {
    outDir: out,
    emptyOutDir: false,
    minify: false,
    sourcemap: false,
    target: 'es2022',
    lib: { entry: join(root, 'vue', 'index.ts'), formats: ['es'] },
    rollupOptions: {
      external: ['vue'],
      output: {
        preserveModules: true,
        preserveModulesRoot: join(root, 'vue'),
        // plugin-vue splits a TS `<script setup>` into a virtual `?vue&type=script` module; name it
        // `BlName.vue.js`, the file the public layout has always had.
        entryFileNames: (chunk) =>
          chunk.name.replace(/\.vue_vue_type_script_setup_true_lang$/, '.vue') + '.js'
      }
    }
  }
})

// plugin-vue also emits a `BlName2.vue.js` wrapper that only re-exports the script module: drop it
// and point its importers at `BlName.vue.js`.
const components = join(out, 'components')
const names: string[] = []
for (const file of readdirSync(components).sort()) {
  if (/\d\.vue\.js$/.test(file)) rmSync(join(components, file))
  else if (file.endsWith('.vue.js')) names.push(file.slice(0, -'.vue.js'.length))
}
const STUB = new RegExp(`/(${names.join('|')})2\\.vue\\.js(['"])`, 'g')
for (const entry of readdirSync(out, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.js')) continue
  const file = join(entry.parentPath, entry.name)
  const source = readFileSync(file, 'utf8')
  const fixed = source.replace(STUB, '/$1.vue.js$2')
  if (fixed !== source) writeFileSync(file, fixed)
  // If the bundler's chunk naming drifts, fail here instead of shipping imports of deleted files.
  if (entry.name.includes('_vue_type_') || /\d\.vue\.js['"]/.test(fixed))
    throw new Error(`build-vue: unexpected chunk naming in ${file}`)
}
if (names.length === 0) throw new Error('build-vue: no compiled components found')
// The Nuxt module registers these; it cannot read the directory itself (no node: builtins).
writeFileSync(join(out, 'components.json'), JSON.stringify(names, null, 2) + '\n')

await $`bunx vue-tsc -p vue/tsconfig.build.json`.cwd(root)

// node16 resolution wants explicit extensions in declaration files: `./x` -> `./x.js`, and
// `./BlX.vue` -> `./BlX.vue.js` (TypeScript maps that to BlX.vue.d.ts).
const RELATIVE = /(from\s+|import\()(['"])(\.{1,2}\/[^'"]+?)\2/g
for (const entry of readdirSync(out, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.d.ts')) continue
  const file = join(entry.parentPath, entry.name)
  const source = readFileSync(file, 'utf8')
  const fixed = source.replace(RELATIVE, (_, lead, quote, path) =>
    path.endsWith('.js') ? _ : `${lead}${quote}${path}.js${quote}`
  )
  if (fixed !== source) writeFileSync(file, fixed)
}
