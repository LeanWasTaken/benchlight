import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

// Semver 2.0.0 (prerelease and build metadata allowed), anchored.
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

export const SOURCE_TAG_PREFIX = 'src-v'

export function isSemver(version: string): boolean {
  return SEMVER.test(version)
}

// `src-v1.2.3` (or `src-v1.2.3-rc.1`) -> `1.2.3`. Throws on anything else, including the
// published tag form `v1.2.3`, so the release job can never re-trigger itself.
export function versionFromSourceTag(tag: string): string {
  const ref = tag.startsWith('refs/tags/') ? tag.slice('refs/tags/'.length) : tag
  if (!ref.startsWith(SOURCE_TAG_PREFIX)) {
    throw new Error(`"${tag}" is not a source tag (expected ${SOURCE_TAG_PREFIX}X.Y.Z)`)
  }
  const version = ref.slice(SOURCE_TAG_PREFIX.length)
  if (!isSemver(version)) throw new Error(`"${tag}" does not carry a valid semver version`)
  return version
}

export function releaseTagName(version: string): string {
  if (!isSemver(version)) throw new Error(`"${version}" is not a valid semver version`)
  return `v${version}`
}

export function assertVersionMatches(manifestVersion: unknown, expected: string): void {
  if (manifestVersion !== expected) {
    throw new Error(
      `package.json version ${JSON.stringify(manifestVersion)} does not match the tag version "${expected}"`
    )
  }
}

// Tarball entries (`tar -tzf`) -> package-relative file paths, directories dropped, sorted.
export function packFileList(tarList: string): string[] {
  return tarList
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('package/') && !line.endsWith('/'))
    .map((line) => line.slice('package/'.length))
    .sort()
}

export function walk(dir: string): string[] {
  const out: string[] = []
  const visit = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) visit(path)
      else out.push(relative(dir, path))
    }
  }
  visit(dir)
  return out.sort()
}

// Files in `installed` that are not part of the pack list (extra) or are missing from it.
export function diffFileLists(
  installed: string[],
  expected: string[]
): { extra: string[]; missing: string[] } {
  const have = new Set(installed)
  const want = new Set(expected)
  return {
    extra: installed.filter((file) => !want.has(file)),
    missing: expected.filter((file) => !have.has(file))
  }
}
