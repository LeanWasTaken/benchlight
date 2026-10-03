import { readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { install, isolate, verifyVite } from './fixtures'

const spec = process.argv[2]
if (!spec) {
  console.error('usage: bun scripts/git-install-check.ts <dependency spec>')
  process.exit(1)
}

const dir = isolate('vite-app', spec)
try {
  await install(dir)
  verifyVite(dir)
  console.log(`git install OK: ${spec}`)
  console.log(`installed: ${readdirSync(join(dir, 'node_modules/benchlight')).sort().join(' ')}`)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
