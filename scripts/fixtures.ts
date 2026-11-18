import { $ } from 'bun'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const PACK_DIR = join(ROOT, '.pack')
export const PACK = join(PACK_DIR, 'benchlight.tgz')

// Bun copies a `file:` directory dependency wholesale and caches tarballs by path,
// so fixtures install a freshly packed tarball after their node_modules and lockfile
// are removed. Packing also applies package.json "files", like a real install.
export async function pack(): Promise<void> {
  rmSync(PACK_DIR, { recursive: true, force: true })
  mkdirSync(PACK_DIR)
  await $`bun pm pack --destination ${PACK_DIR}`.cwd(ROOT).quiet()
  const tarball = readdirSync(PACK_DIR).find((file) => file.endsWith('.tgz'))
  if (!tarball) throw new Error('bun pm pack produced no tarball')
  renameSync(join(PACK_DIR, tarball), PACK)
}

// Fixtures are built from a copy outside the repo, like a real consumer: inside it, module
// resolution would quietly fall back to this repo's own node_modules (TypeScript included).
export function isolate(name: string, benchlight: string): string {
  const dir = mkdtempSync(join(tmpdir(), `benchlight-${name}-`))
  cpSync(join(ROOT, 'fixtures', name), dir, {
    recursive: true,
    filter: (source) =>
      !['node_modules', 'dist', 'bun.lock', '.nuxt', '.output'].includes(basename(source))
  })
  const manifestPath = join(dir, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.dependencies.benchlight = benchlight
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  return dir
}

export async function install(dir: string): Promise<void> {
  for (const path of ['node_modules', 'bun.lock', '.nuxt', '.output', 'dist']) {
    rmSync(join(dir, path), { recursive: true, force: true })
  }
  await $`bun install`.cwd(dir).quiet()
  await $`bun run build`.cwd(dir).quiet()
  if (JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).scripts?.typecheck) {
    // A consumer's typecheck covers the TypeScript source benchlight ships.
    const result = await $`bun run typecheck`.cwd(dir).nothrow().quiet()
    if (result.exitCode !== 0) {
      throw new Error(`${dir}: typecheck failed\n${result.stdout}${result.stderr}`)
    }
  }
}

function readAll(dir: string, extension: string): string {
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(extension))
    .map((file) => readFileSync(join(dir, file), 'utf8'))
    .join('\n')
}

function expectAll(haystack: string, needles: readonly string[], where: string): void {
  for (const needle of needles) {
    if (!haystack.includes(needle)) throw new Error(`${where}: missing ${JSON.stringify(needle)}`)
  }
}

function expectNone(haystack: string, needles: readonly string[], where: string): void {
  for (const needle of needles) {
    if (haystack.includes(needle)) throw new Error(`${where}: unexpected ${JSON.stringify(needle)}`)
  }
}

export const VITE_EXPECTATIONS = {
  html: ['bl-appearance'],
  css: [
    '--bl-color-canvas',
    '.bl-display',
    '@font-face',
    'Bricolage Grotesque',
    '.bl-btn--secondary',
    ':dir(rtl)'
  ],
  cssAbsent: [':lang(ae)'],
  js: ['bl-led', 'bl-meter', 'bl-btn', 'bl-appearance__track', 'bl-table', 'bl-pagination']
}

export const NUXT_EXPECTATIONS = {
  page: [
    'data-bl-appearance',
    'bl-site-bar',
    'bl-appearance__track',
    'bl-led bl-led--on',
    'bl-spec-row',
    'bl-table',
    'bl-pagination',
    '--bl-rise-delay:60ms',
    // A closed BlLightbox renders on the server: dialog, bar slots and stage, never open.
    'class="bl-lightbox"',
    'bl-lightbox__title',
    'bl-lightbox__actions',
    'bl-lightbox__stage bl-lightbox__stage--zoomable',
    'bl-lightbox__frame',
    'bl-lightbox__zoom'
  ],
  css: [
    '.bg-surface',
    'var(--bl-color-surface)',
    '.font-display',
    '@font-face',
    '.bl-display',
    '.bl-prose',
    ':dir(rtl)'
  ],
  cssAbsent: [':lang(ae)']
}

export function verifyVite(dir: string): void {
  const dist = join(dir, 'dist')
  expectAll(readFileSync(join(dist, 'index.html'), 'utf8'), VITE_EXPECTATIONS.html, 'vite html')
  const css = readAll(join(dist, 'assets'), '.css')
  expectAll(css, VITE_EXPECTATIONS.css, 'vite css')
  expectNone(css, VITE_EXPECTATIONS.cssAbsent, 'vite css')
  expectAll(readAll(join(dist, 'assets'), '.js'), VITE_EXPECTATIONS.js, 'vite js')
}

// The library's development warnings hang off `process.env.NODE_ENV`, which the consumer's bundler
// has to replace; a production build then drops them. (tests/dist-vue.test.ts covers the dev side.)
export const DEV_WARNING_MARKER = '[benchlight] '

export function viteScripts(dir: string): string {
  return readAll(join(dir, 'dist', 'assets'), '.js')
}

export function verifyViteProduction(dir: string): void {
  if (viteScripts(dir).includes(DEV_WARNING_MARKER)) {
    throw new Error('vite production build still contains the library dev warnings')
  }
}

async function waitFor(url: string, timeoutMs = 20_000): Promise<string> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return await response.text()
    } catch {
      // server not listening yet
    }
    await Bun.sleep(250)
  }
  throw new Error(`${url} did not respond within ${timeoutMs}ms`)
}

export async function verifyNuxt(dir: string): Promise<void> {
  const port = '3999'
  const server = Bun.spawn(['node', join(dir, '.output/server/index.mjs')], {
    env: { ...process.env, PORT: port, NITRO_PORT: port },
    stdout: 'ignore',
    stderr: 'inherit'
  })
  try {
    const base = `http://127.0.0.1:${port}`
    const page = await waitFor(`${base}/`)
    expectAll(page, NUXT_EXPECTATIONS.page, 'nuxt page')
    const lightbox = /<dialog[^>]*class="bl-lightbox"[^>]*>/.exec(page)?.[0] ?? ''
    if (/\sopen[\s=>]/.test(lightbox)) throw new Error(`nuxt page: lightbox open: ${lightbox}`)
    const api = (await (await fetch(`${base}/api/tokens`)).json()) as { canvas?: string }
    if (api.canvas !== '#101214') throw new Error(`nuxt /api/tokens: ${JSON.stringify(api)}`)
    const css = readAll(join(dir, '.output/public/_nuxt'), '.css')
    expectAll(css, NUXT_EXPECTATIONS.css, 'nuxt css')
    expectNone(css, NUXT_EXPECTATIONS.cssAbsent, 'nuxt css')
    if (readAll(join(dir, '.output'), '.mjs').includes(DEV_WARNING_MARKER)) {
      throw new Error('nuxt production build still contains the library dev warnings')
    }
  } finally {
    server.kill()
  }
}

if (import.meta.main) {
  await pack()
  const vite = isolate('vite-app', `file:${PACK}`)
  const nuxt = isolate('nuxt-app', `file:${PACK}`)
  try {
    await install(vite)
    verifyVite(vite)
    verifyViteProduction(vite)
    console.log('vite fixture OK')
    await install(nuxt)
    await verifyNuxt(nuxt)
    console.log('nuxt fixture OK')
  } finally {
    rmSync(vite, { recursive: true, force: true })
    rmSync(nuxt, { recursive: true, force: true })
  }
}
