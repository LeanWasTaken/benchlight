// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('CI browser job', () => {
  it('runs the Playwright image matching the installed @playwright/test', () => {
    const { version } = JSON.parse(read('node_modules/@playwright/test/package.json')) as {
      version: string
    }
    expect(read('.github/workflows/ci.yml')).toContain(
      `image: mcr.microsoft.com/playwright:v${version}-noble`
    )
  })
})

const workflow = read('.github/workflows/ci.yml')

// Job name -> raw block text; the workflow is parsed by line because no YAML parser is installed.
const jobs = (() => {
  const body = workflow.slice(workflow.search(/^jobs:\s*$/m))
  const heads = [...body.matchAll(/^ {2}([\w-]+):\s*$/gm)]
  return Object.fromEntries(
    heads.map((head, i) => [head[1]!, body.slice(head.index, heads[i + 1]?.index ?? body.length)])
  )
})()

describe('CI hardening', () => {
  it('parses the three expected jobs', () => {
    expect(Object.keys(jobs)).toEqual(['check', 'browser', 'git-install'])
  })

  it('grants the token read-only contents at the top level', () => {
    expect(workflow).toMatch(/^permissions:\n {2}contents: read\n/m)
    expect(workflow).not.toMatch(/^ {4,}permissions:/m)
  })

  it('cancels superseded runs per ref but never a tag run', () => {
    expect(workflow).toMatch(/^concurrency:\n {2}group: ci-\$\{\{ github\.ref \}\}\n/m)
    expect(workflow).toContain("cancel-in-progress: ${{ !startsWith(github.ref, 'refs/tags/') }}")
  })

  it.each(['check', 'browser', 'git-install'])('%s has a timeout of at most 15 minutes', (name) => {
    const minutes = /^ {4}timeout-minutes: (\d+)$/m.exec(jobs[name]!)?.[1]
    expect(Number(minutes)).toBeGreaterThan(0)
    expect(Number(minutes)).toBeLessThanOrEqual(15)
  })

  it('pins every action by full commit SHA with a version comment', () => {
    const uses = workflow.split('\n').filter((line) => /^\s*(- )?uses:/.test(line))
    expect(uses.length).toBeGreaterThanOrEqual(5)
    for (const line of uses) {
      expect(line).toMatch(/uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+/)
    }
  })

  it('takes one bun version from package.json packageManager in every job', () => {
    const { packageManager } = JSON.parse(read('package.json')) as { packageManager?: string }
    expect(packageManager).toMatch(/^bun@\d+\.\d+\.\d+$/)
    expect(workflow).not.toMatch(/(?<![-\w])bun@\d/)
    for (const name of ['check', 'git-install']) {
      expect(jobs[name]).toMatch(
        /setup-bun@[0-9a-f]{40} # v2\n\s+with:\n\s+bun-version-file: package\.json/
      )
    }
    expect(jobs['browser']).toContain("require('./package.json').packageManager.split('@')[1]")
  })

  it('scopes the deploy key to the git-install step and removes it afterwards', () => {
    const job = jobs['git-install']!
    expect(workflow).not.toContain('~/.ssh')
    expect(job).toContain('key="$RUNNER_TEMP/benchlight_deploy_key"')
    expect(job).toContain('echo "DEPLOY_KEY_FILE=$key" >> "$GITHUB_ENV"')
    expect(job).toMatch(/GIT_SSH_COMMAND="ssh -i \$DEPLOY_KEY_FILE -o IdentitiesOnly=yes /)
    expect(job).toContain('StrictHostKeyChecking=yes')
    expect(job).toMatch(
      /- name: Remove the deploy key\n\s+if: always\(\)\n\s+run: rm -f "\$DEPLOY_KEY_FILE"/
    )
    // The key is only exported where the install runs, not for the whole job.
    expect(job.split('GIT_SSH_COMMAND=').length - 1).toBe(1)
  })

  it('never reads the runner context in job-level env (not allowed there)', () => {
    for (const [name, job] of Object.entries(jobs)) {
      const env = /^ {4}env:\n((?: {6}.*\n)+)/m.exec(job)?.[1] ?? ''
      expect(env, name).not.toMatch(/\brunner\./)
    }
  })

  it('lints workflows with the same pinned actionlint image locally and in CI', () => {
    const script = (JSON.parse(read('package.json')) as { scripts: Record<string, string> })
      .scripts['lint:workflows']!
    expect(script).toMatch(/docker run --rm .*rhysd\/actionlint:\d+\.\d+\.\d+/)
    expect(jobs['check']).toContain('run: bun run lint:workflows')
  })
})
