#!/usr/bin/env bash
# Runs the Playwright suite inside the same Linux image CI uses, so Linux screenshot baselines can be
# checked or re-recorded from a Mac. Extra arguments go to `playwright test`, for example:
#   scripts/visual-linux.sh --update-snapshots -g "renders every"
# Needs Docker. Only tests/visual/__screenshots__ is written back to the working tree.
set -euo pipefail
cd "$(dirname "$0")/.."

version=$(node -p "require('./node_modules/@playwright/test/package.json').version")
bun_version=$(bun --version)

docker run --rm --platform linux/amd64 --ipc=host \
  -v "$PWD":/src:ro -v "$PWD/tests/visual/__screenshots__":/shots \
  -e CI=1 -e BUN_VERSION="$bun_version" \
  "mcr.microsoft.com/playwright:v$version-noble" bash -c '
    set -euo pipefail
    mkdir /work
    tar -C /src --exclude=./node_modules --exclude=./.git --exclude=./showcase \
      --exclude="./fixtures/*/node_modules" -cf - . | tar -C /work -xf -
    cd /work
    npm install -g "bun@$BUN_VERSION" >/dev/null 2>&1
    bun install --frozen-lockfile >/dev/null
    status=0
    bunx playwright test "$@" || status=$?
    cp tests/visual/__screenshots__/*-linux.png /shots/
    exit "$status"
  ' bash "$@"
