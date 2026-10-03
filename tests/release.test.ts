// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  assertVersionMatches,
  diffFileLists,
  isSemver,
  packFileList,
  releaseTagName,
  versionFromSourceTag
} from '../scripts/lib/release'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('release tag parsing', () => {
  it.each([
    ['src-v0.3.0', '0.3.0'],
    ['src-v10.20.30', '10.20.30'],
    ['src-v1.0.0-rc.1', '1.0.0-rc.1'],
    ['src-v1.0.0-alpha-2+build.5', '1.0.0-alpha-2+build.5'],
    ['refs/tags/src-v0.3.0', '0.3.0']
  ])('reads the version from %s', (tag, version) => {
    expect(versionFromSourceTag(tag)).toBe(version)
  })

  it.each([
    'v0.3.0',
    'src-0.3.0',
    'src-v',
    'src-v1.2',
    'src-v01.2.3',
    'src-v1.2.3.4',
    'src-v1.2.3-',
    'src-v1.2.3-01',
    'src-vlatest',
    'release',
    ''
  ])('rejects %j', (tag) => {
    expect(() => versionFromSourceTag(tag)).toThrow()
  })

  it('builds the published tag name and never from an invalid version', () => {
    expect(releaseTagName('0.3.0')).toBe('v0.3.0')
    expect(releaseTagName('1.0.0-rc.1')).toBe('v1.0.0-rc.1')
    expect(() => releaseTagName('v0.3.0')).toThrow()
    expect(isSemver('1.2.3')).toBe(true)
    expect(isSemver('1.2')).toBe(false)
  })

  it('requires package.json to carry the tag version', () => {
    expect(() => assertVersionMatches('0.3.0', '0.3.0')).not.toThrow()
    expect(() => assertVersionMatches('0.2.1', '0.3.0')).toThrow(/does not match/)
    expect(() => assertVersionMatches(undefined, '0.3.0')).toThrow()
  })
})

describe('release tree file lists', () => {
  it('turns tar listings into sorted package-relative files', () => {
    const listing =
      'package/\npackage/package.json\npackage/css/\npackage/css/base.css\npackage/API.md\n'
    expect(packFileList(listing)).toEqual(['API.md', 'css/base.css', 'package.json'])
  })

  it('reports files outside the pack list and files missing from it', () => {
    expect(
      diffFileLists(
        ['package.json', 'tests/a.ts', 'css/base.css'],
        ['css/base.css', 'API.md', 'package.json']
      )
    ).toEqual({ extra: ['tests/a.ts'], missing: ['API.md'] })
    expect(diffFileLists(['a'], ['a'])).toEqual({ extra: [], missing: [] })
  })
})

const workflow = read('.github/workflows/release.yml')
const ci = read('.github/workflows/ci.yml')

describe('release workflow', () => {
  it('runs on source tags only', () => {
    expect(workflow).toMatch(/^on:\n {2}push:\n {4}tags: \['src-v\*'\]\n/m)
    expect(workflow).not.toMatch(/branches:/)
  })

  it('grants write access to the release job only', () => {
    expect(workflow).toMatch(/^permissions:\n {2}contents: read\n/m)
    expect(workflow.match(/permissions:/g)).toHaveLength(3)
    expect(workflow.match(/contents: write/g)).toHaveLength(1)
    expect(workflow).toMatch(/^ {4}permissions:\n {6}contents: write\n/m)
    const timeout = /^ {4}timeout-minutes: (\d+)$/m.exec(workflow)?.[1]
    expect(Number(timeout)).toBeGreaterThan(0)
    expect(Number(timeout)).toBeLessThanOrEqual(20)
  })

  it('never cancels a release in flight', () => {
    expect(workflow).toMatch(/^concurrency:\n {2}group: release\n/m)
    expect(workflow).toContain('cancel-in-progress: false')
  })

  it('pins every action by full SHA, with the same SHAs as ci.yml, and bun from package.json', () => {
    const uses = workflow.split('\n').filter((line) => /^\s*(- )?uses:/.test(line))
    expect(uses).toHaveLength(4)
    for (const line of uses) {
      expect(line).toMatch(/uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+/)
      expect(ci).toContain(line.trim())
    }
    expect(workflow).toMatch(
      /setup-bun@[0-9a-f]{40} # v2\n\s+with:\n\s+bun-version-file: package\.json/
    )
    expect(workflow).not.toMatch(/(?<![-\w])bun@\d/)
  })

  it('checks the source before it publishes anything', () => {
    const at = (needle: string) => workflow.indexOf(needle)
    expect(at('run: bun run check')).toBeGreaterThan(0)
    expect(at('run: bun run check')).toBeLessThan(at('scripts/release-tree.ts'))
    expect(at('run: bun run fixtures')).toBeLessThan(at('scripts/release-tree.ts'))
    expect(at('scripts/release-tree.ts')).toBeLessThan(at('git push'))
  })

  it('refuses an existing tag and pushes branch and tag atomically without force', () => {
    expect(workflow).toContain('existing="$(git ls-remote --tags origin "refs/tags/${tag}")"')
    expect(workflow).toContain('heads="$(git ls-remote --heads origin refs/heads/release)"')
    expect(workflow.indexOf('if [ -n "$existing" ]')).toBeLessThan(workflow.indexOf('git push'))
    expect(workflow).toContain('rm -f "$GIT_INDEX_FILE"')
    expect(workflow).toContain('-m "${tag} (source ${GITHUB_REF_NAME} ${GITHUB_SHA})"')
    expect(workflow).toContain(
      'git push --atomic origin "${commit}:refs/heads/release" "refs/tags/${tag}"'
    )
    expect(workflow).not.toMatch(/--force|push -f|\+refs\/heads\/release"? *$/m)
  })

  it('only releases commits that are on main, before any check or publish', () => {
    expect(workflow).toContain(
      'git merge-base --is-ancestor "$GITHUB_SHA" refs/remotes/origin/main'
    )
    expect(workflow).toContain('fetch-depth: 0')
    expect(workflow.indexOf('merge-base --is-ancestor')).toBeLessThan(
      workflow.indexOf('run: bun run check')
    )
  })

  it('verifies in a separate job that needs the release job and runs read-only', () => {
    const verify = workflow.slice(workflow.search(/^ {2}verify:\n/m))
    expect(verify).toMatch(/^ {4}needs: release\n/m)
    expect(verify).toMatch(/^ {4}permissions:\n {6}contents: read\n/m)
    expect(verify).toContain('git-install-check.ts --expect-slim')
    expect(verify).toContain('if: always()')
    expect(workflow.slice(0, workflow.search(/^ {2}verify:\n/m))).not.toContain('--expect-slim')
  })

  it('keeps the deploy key out of the default ssh dir and removes it afterwards', () => {
    expect(workflow).not.toContain('~/.ssh')
    expect(workflow).toContain('key="$RUNNER_TEMP/benchlight_deploy_key"')
    expect(workflow).toMatch(/GIT_SSH_COMMAND="ssh -i \$DEPLOY_KEY_FILE -o IdentitiesOnly=yes /)
    expect(workflow).toContain('StrictHostKeyChecking=yes')
    expect(workflow.split('GIT_SSH_COMMAND=').length - 1).toBe(1)
    expect(workflow).toMatch(
      /- name: Remove the deploy key\n\s+if: always\(\)\n\s+run: rm -f "\$DEPLOY_KEY_FILE"/
    )
    expect(workflow).toContain('git-install-check.ts --expect-slim "git+ssh://')
  })
})

describe('ci workflow and the release branch', () => {
  it('does not run on the slim release branch, which has no tests', () => {
    expect(ci).toMatch(/^ {4}branches-ignore: \[release\]$/m)
    expect(ci).not.toMatch(/^ {4}branches:/m)
  })

  it('runs for source tags, not for the published consumer tags', () => {
    expect(ci).toMatch(/^ {4}tags: \['src-v\*'\]$/m)
  })
})
