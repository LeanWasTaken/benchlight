import { $ } from 'bun'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  assertVersionMatches,
  diffFileLists,
  packFileList,
  releaseTagName,
  versionFromSourceTag,
  walk
} from './lib/release'

const ROOT = join(import.meta.dir, '..')

// Packs the repo with `bun pm pack` and returns the tarball path plus its sorted file list.
export async function packRepo(dest: string): Promise<{ tarball: string; files: string[] }> {
  mkdirSync(dest, { recursive: true })
  await $`bun pm pack --destination ${dest}`.cwd(ROOT).quiet()
  const name = readdirSync(dest).find((file) => file.endsWith('.tgz'))
  if (!name) throw new Error('bun pm pack produced no tarball')
  const tarball = join(dest, name)
  const files = packFileList(await $`tar -tzf ${tarball}`.text())
  return { tarball, files }
}

async function main(argv: string[]): Promise<void> {
  const args = argv.slice(2)
  const tagIndex = args.indexOf('--tag')
  const tag = tagIndex === -1 ? undefined : args[tagIndex + 1]
  const positional = args.filter((arg, i) => !arg.startsWith('--') && i !== tagIndex + 1)
  const outDir = positional[0]
  if (!tag || !outDir || positional.length !== 1) {
    throw new Error('usage: bun scripts/release-tree.ts <outDir> --tag src-vX.Y.Z')
  }

  const version = versionFromSourceTag(tag)
  const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    version?: unknown
  }
  assertVersionMatches(manifest.version, version)

  const out = resolve(outDir)
  if (existsSync(out) && (!statSync(out).isDirectory() || readdirSync(out).length > 0)) {
    throw new Error(`${out} must be empty or absent`)
  }

  const work = mkdtempSync(join(tmpdir(), 'benchlight-release-'))
  try {
    const { tarball, files } = await packRepo(work)
    await $`tar -xzf ${tarball} -C ${work}`.quiet()
    mkdirSync(out, { recursive: true })
    cpSync(join(work, 'package'), out, { recursive: true })
    // The tree must be exactly the tarball contents.
    const { extra, missing } = diffFileLists(walk(out), files)
    if (extra.length > 0 || missing.length > 0) {
      throw new Error(`tree differs from the pack list: extra [${extra}], missing [${missing}]`)
    }
    console.log(`release tree for ${releaseTagName(version)}: ${files.length} files in ${out}`)
    for (const file of files) console.log(file)
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

if (import.meta.main) {
  main(process.argv).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
