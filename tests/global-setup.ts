import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')

export default function setup(): void {
  if (
    existsSync(join(root, 'dist', 'vue', 'components.json')) &&
    existsSync(join(root, 'dist', 'nuxt', 'module.mjs'))
  ) {
    return
  }
  execFileSync('bun', ['run', 'build:js'], { cwd: root, stdio: 'inherit' })
}
