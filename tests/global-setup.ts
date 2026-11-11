import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const outputs = [
  join(root, 'dist', 'vue', 'components.json'),
  join(root, 'dist', 'nuxt', 'module.mjs')
]

// Newest modification time under a directory (0 when it does not exist).
function newest(dir: string): number {
  if (!existsSync(dir)) return 0
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .reduce(
      (time, entry) => Math.max(time, statSync(join(entry.parentPath, entry.name)).mtimeMs),
      0
    )
}

// Rebuilds dist/vue and dist/nuxt unless both outputs exist and are newer than every source file.
export default function setup(): void {
  const sources = Math.max(newest(join(root, 'vue')), newest(join(root, 'nuxt')))
  if (outputs.every((file) => existsSync(file) && statSync(file).mtimeMs >= sources)) return
  execFileSync('bun', ['run', 'build:js'], { cwd: root, stdio: 'inherit' })
}
