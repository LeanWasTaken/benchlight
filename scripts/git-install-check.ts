import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { install, isolate, verifyVite } from './fixtures'
import { diffFileLists, walk } from './lib/release'
import { packRepo } from './release-tree'

const args = process.argv.slice(2)
const expectSlim = args.includes('--expect-slim')
const spec = args.find((arg) => !arg.startsWith('--'))
if (!spec) {
  console.error('usage: bun scripts/git-install-check.ts [--expect-slim] <dependency spec>')
  process.exit(1)
}

const dir = isolate('vite-app', spec)
try {
  await install(dir)
  verifyVite(dir)
  console.log(`git install OK: ${spec}`)
  // Bun may leave its own bookkeeping (.git, .bun-tag) in a git dependency; it is not package content.
  const installed = walk(join(dir, 'node_modules/benchlight')).filter(
    (file) => file !== '.bun-tag' && !file.startsWith('.git/')
  )
  console.log(`installed: ${installed.length} files`)
  if (expectSlim) {
    // A slim release ships exactly what `bun pm pack` of the source tree would.
    const scratch = mkdtempSync(join(tmpdir(), 'benchlight-slim-'))
    try {
      const { files } = await packRepo(scratch)
      const { extra, missing } = diffFileLists(installed, files)
      if (extra.length > 0 || missing.length > 0) {
        console.error(`not slim: extra [${extra.join(' ')}], missing [${missing.join(' ')}]`)
        process.exit(1)
      }
      console.log('slim install OK: installed files equal the pack list')
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}
