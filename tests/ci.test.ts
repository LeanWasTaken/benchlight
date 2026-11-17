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

  it('runs Playwright with HOME=/root so Firefox launches as root in the container', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(
      /- run: bunx playwright test\n(?: {8}#.*\n)* {8}env:\n {10}HOME: \/root\n/
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
  it('parses the two expected jobs', () => {
    expect(Object.keys(jobs)).toEqual(['check', 'browser'])
  })

  it('grants the token read-only contents at the top level', () => {
    expect(workflow).toMatch(/^permissions:\n {2}contents: read\n/m)
    expect(workflow).not.toMatch(/^ {4,}permissions:/m)
  })

  it('cancels superseded runs per ref but never a tag run', () => {
    expect(workflow).toMatch(/^concurrency:\n {2}group: ci-\$\{\{ github\.ref \}\}\n/m)
    expect(workflow).toContain("cancel-in-progress: ${{ !startsWith(github.ref, 'refs/tags/') }}")
  })

  it.each(['check', 'browser'])('%s has a timeout of at most 15 minutes', (name) => {
    const minutes = /^ {4}timeout-minutes: (\d+)$/m.exec(jobs[name]!)?.[1]
    expect(Number(minutes)).toBeGreaterThan(0)
    expect(Number(minutes)).toBeLessThanOrEqual(15)
  })

  it('pins every action by full commit SHA with a version comment', () => {
    const uses = workflow.split('\n').filter((line) => /^\s*(- )?uses:/.test(line))
    expect(uses.length).toBeGreaterThanOrEqual(4)
    for (const line of uses) {
      expect(line).toMatch(/uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+/)
    }
  })

  it('takes one bun version from package.json packageManager in every job', () => {
    const { packageManager } = JSON.parse(read('package.json')) as { packageManager?: string }
    expect(packageManager).toMatch(/^bun@\d+\.\d+\.\d+$/)
    expect(workflow).not.toMatch(/(?<![-\w])bun@\d/)
    expect(jobs['check']).toMatch(
      /setup-bun@[0-9a-f]{40} # v2\n\s+with:\n\s+bun-version-file: package\.json/
    )
    expect(jobs['browser']).toContain("require('./package.json').packageManager.split('@')[1]")
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

describe('release workflow credentials', () => {
  const release = read('.github/workflows/release.yml')

  it.each([
    ['ci.yml', workflow],
    ['release.yml', release]
  ])('%s checks out without persisting the token', (_name, text) => {
    const checkouts = text.split('\n').filter((line) => /uses: actions\/checkout@/.test(line))
    expect(checkouts.length).toBeGreaterThan(0)
    expect(text.match(/persist-credentials: false/g)).toHaveLength(checkouts.length)
    expect(text).not.toMatch(/persist-credentials: true/)
  })

  it('hands the write token to git per command, never through the checkout', () => {
    expect(release).toContain('GH_TOKEN: ${{ github.token }}')
    expect(release).toContain('"${remote[@]}" push --atomic origin')
    expect(release).not.toMatch(/^\s+(?!"\$\{remote)git push/m)
  })
})

describe('publish workflow', () => {
  const publish = read('.github/workflows/publish.yml')
  const code = publish
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n')

  it('runs only on manual dispatch, never on a tag or push', () => {
    expect(code).toMatch(/^on:\n {2}workflow_dispatch:\n/m)
    expect(code).not.toMatch(
      /^ {2}(push|pull_request|pull_request_target|release|schedule|workflow_run):/m
    )
    expect(code).not.toMatch(/^\s+tags:/m)
  })

  // Job name -> raw block text, parsed by line like the ci.yml jobs above.
  const pubJobs = (() => {
    const body = code.slice(code.search(/^jobs:\s*$/m))
    const heads = [...body.matchAll(/^ {2}([\w-]+):\s*$/gm)]
    return Object.fromEntries(
      heads.map((head, i) => [head[1]!, body.slice(head.index, heads[i + 1]?.index ?? body.length)])
    )
  })()
  const build = pubJobs['build']!
  const publishJob = pubJobs['publish']!

  it('splits into a build job and a publish job that needs it', () => {
    expect(Object.keys(pubJobs)).toEqual(['build', 'publish'])
    expect(publishJob).toMatch(/^ {4}needs: build$/m)
    expect(publishJob).toMatch(/^ {4}environment: npm-publish$/m)
  })

  it('requires the confirm and version inputs, on a matching src-v tag, in both jobs', () => {
    expect(code).toMatch(/confirm:\n\s+description: .*\n\s+type: boolean\n\s+required: true/)
    expect(code).toMatch(/version:\n\s+description: .*\n\s+type: string\n\s+required: true/)
    expect(code).not.toContain('refs/heads/main"')
    for (const [name, job] of Object.entries(pubJobs)) {
      expect(job, name).toContain('"$GITHUB_REF" != refs/tags/src-v*')
      expect(job, name).toContain('"$INPUT_CONFIRM" != "true"')
      expect(job, name).toContain('"src-v${INPUT_VERSION}" != "$GITHUB_REF_NAME"')
      expect(job, name).toContain('INPUT_VERSION: ${{ inputs.version }}')
    }
  })

  it('requires the tagged commit on main and the same package.json version before installing', () => {
    expect(build).toMatch(/fetch-depth: 0/)
    expect(code).not.toMatch(/git (-c .* )?fetch|GH_TOKEN|github\.token/)
    expect(build).toContain('git merge-base --is-ancestor "$GITHUB_SHA" refs/remotes/origin/main')
    expect(build).toContain('"$INPUT_VERSION" != "$pkg"')
    expect(build.indexOf('merge-base --is-ancestor')).toBeLessThan(build.indexOf('bun install'))
  })

  it('fails fast before checkout when npm lacks the package or already has the version', () => {
    expect(build).toContain('npm view benchlight versions --json')
    expect(build).toContain('E404')
    expect(build).toContain('is already on npm')
    expect(build.indexOf('npm view')).toBeLessThan(build.indexOf('actions/checkout'))
  })

  it('fails fast before publishing when npm does not trust the workflow', () => {
    expect(publishJob).toContain('audience=npm:registry.npmjs.org')
    expect(publishJob).toContain('/-/npm/v1/oidc/token/exchange/package/benchlight')
    expect(publishJob).toContain('::add-mask::')
    expect(publishJob.indexOf('oidc/token/exchange')).toBeLessThan(
      publishJob.indexOf('npm publish')
    )
  })

  it('grants id-token only on the publish job, read-only contents elsewhere', () => {
    expect(code).toMatch(/^permissions:\n {2}contents: read\n/m)
    expect(code.match(/id-token: write/g)).toHaveLength(1)
    expect(build).toMatch(/^ {4}permissions:\n {6}contents: read\n {4}env:/m)
    expect(build).not.toContain('id-token')
    expect(publishJob).toMatch(/^ {4}permissions:\n {6}contents: read\n {6}id-token: write\n/m)
  })

  it('keeps the publish job free of checkout and install steps', () => {
    expect(publishJob).not.toMatch(
      /actions\/checkout|setup-bun|bun install|bun run|npm (ci|install)/
    )
    expect(publishJob).toContain('actions/download-artifact@')
  })

  it('checks out without persisting the token and installs only in the build job', () => {
    expect(build).toContain('persist-credentials: false')
    expect(code).not.toMatch(/persist-credentials: true/)
    expect(build).toContain('run: bun install --frozen-lockfile')
    expect(build).toContain('run: bun run check')
  })

  it('pins every action by full commit SHA, upload and download included', () => {
    const uses = code.split('\n').filter((line) => /^\s*(- )?uses:/.test(line))
    expect(uses.length).toBeGreaterThanOrEqual(6)
    for (const line of uses) {
      expect(line).toMatch(/uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+/)
    }
    expect(build).toMatch(/uses: actions\/upload-artifact@[0-9a-f]{40} # v7/)
    expect(publishJob).toMatch(/uses: actions\/download-artifact@[0-9a-f]{40} # v8/)
    // Same upload-artifact pin as ci.yml.
    const ciUpload = /actions\/upload-artifact@[0-9a-f]{40}/.exec(workflow)?.[0]
    expect(build).toContain(ciUpload)
  })

  it('packs the tarball in build and publishes that exact tarball', () => {
    expect(build).toContain('npm pack --ignore-scripts')
    expect(build).toMatch(/path: benchlight-\$\{\{ inputs\.version \}\}\.tgz/)
    expect(publishJob).toContain('name: package-tarball')
    expect(publishJob).toContain(
      'npm publish "./${tarball}" --provenance --access public --ignore-scripts'
    )
    expect(build).not.toContain('npm publish')
  })

  it('fails fast on an npm older than 11.5.1', () => {
    expect(publishJob).toContain('npm --version')
    expect(publishJob).toContain('need >= 11.5.1')
    expect(publishJob.indexOf('setup-node')).toBeLessThan(publishJob.indexOf('npm --version'))
  })

  it('keeps setup-node from restoring a dependency cache in either job', () => {
    // setup-node v5+ caches automatically when it detects a package manager.
    expect(build).toContain('package-manager-cache: false')
    expect(publishJob).toContain('package-manager-cache: false')
  })

  it('publishes through OIDC, with no npm token or secret', () => {
    expect(code).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN|secrets\./)
  })

  it('never expands an expression inside a run script', () => {
    const scripts = [...code.matchAll(/^( +)run: \|\n((?:\1 {2}.*\n|\s*\n)+)/gm)]
    expect(scripts.length).toBeGreaterThanOrEqual(6)
    for (const [, , body] of scripts) expect(body).not.toContain('${{')
  })

  it('never configures a registry-url (no .npmrc token plumbing)', () => {
    expect(publish).not.toContain('registry-url:')
  })

  it('accepts only a plain X.Y.Z version', () => {
    expect(build).toContain('"$INPUT_VERSION" =~ ^[0-9]+\\.[0-9]+\\.[0-9]+$ ]]')
    expect(code).not.toMatch(/\(-\[0-9A-Za-z/)
  })

  it('lints the package after check and checks the packed entry points', () => {
    const at = (text: string) => build.indexOf(text)
    expect(at('run: bun run check')).toBeLessThan(at('run: bun run lint:package'))
    expect(at('run: bun run lint:package')).toBeLessThan(at('npm pack --ignore-scripts'))
    expect(build).toContain('tar -tzf "benchlight-${INPUT_VERSION}.tgz"')
    expect(build).toContain('package/dist/vue/index.js package/dist/nuxt/module.mjs')
    expect(build).toMatch(/^ {10}retention-days: 1$/m)
  })

  it('checks the tarball name and that it holds no .npmrc before publishing', () => {
    expect(publishJob).toContain('"$name" != "benchlight"')
    expect(publishJob).toContain('contents="$(tar -tzf "$tarball")"')
    expect(publishJob).toContain('grep -q \'\\.npmrc$\' <<<"$contents"')
    expect(code).not.toMatch(/tar -t\S* [^\n]*\| *grep/)
    expect(publishJob.indexOf('.npmrc')).toBeLessThan(publishJob.indexOf('npm publish'))
  })

  it('keeps the OIDC exchange body in a temp file and removes it either way', () => {
    expect(publishJob).toContain('body="$RUNNER_TEMP/oidc-exchange.json"')
    expect(publishJob).toContain('-o "$body"')
    expect(publishJob.match(/rm -f "\$body"/g)).toHaveLength(2)
  })
})

describe('bun install cache', () => {
  it.each(['ci.yml', 'release.yml'])(
    '%s caches the bun install cache keyed on bun.lock',
    (name) => {
      const text = read(`.github/workflows/${name}`)
      expect(text).toContain('path: ~/.bun/install/cache')
      expect(text).toContain("hashFiles('bun.lock')")
    }
  )
})

describe('image digests', () => {
  const digest = (text: string, image: RegExp) => image.exec(text)?.[1]

  it('pins the Playwright image by digest, the same in CI and visual-linux.sh', () => {
    const ci = digest(workflow, /playwright:v[\d.]+-noble@(sha256:[0-9a-f]{64})/)
    const local = digest(
      read('scripts/visual-linux.sh'),
      /playwright:v\$version-noble@(sha256:[0-9a-f]{64})/
    )
    expect(ci).toBeDefined()
    expect(local).toBe(ci)
  })

  it('pins the actionlint image by digest', () => {
    const script = (JSON.parse(read('package.json')) as { scripts: Record<string, string> })
      .scripts['lint:workflows']!
    expect(script).toMatch(/rhysd\/actionlint:\d+\.\d+\.\d+@sha256:[0-9a-f]{64}/)
  })
})
