import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { install, verifyVite } from './fixtures'

const spec = process.argv[2]
if (!spec) {
  console.error('usage: bun scripts/git-install-check.ts <dependency spec>')
  process.exit(1)
}

const dir = mkdtempSync(join(tmpdir(), 'benchlight-git-'))
try {
  cpSync(join(import.meta.dir, '../fixtures/vite-app'), dir, {
    recursive: true,
    filter: (source) => !['node_modules', 'dist', 'bun.lock'].includes(basename(source))
  })
  const manifestPath = join(dir, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.dependencies.benchlight = spec
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  await install(dir)
  verifyVite(dir)
  console.log(`git install OK: ${spec}`)
  console.log(`installed: ${readdirSync(join(dir, 'node_modules/benchlight')).sort().join(' ')}`)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
