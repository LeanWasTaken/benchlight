#!/usr/bin/env bash
# Regenerates the compact subsets in fonts/subset/ from fonts/full with fontTools (subset, then
# instance). Run by hand when a subset needs new glyphs, then update the sha256 values in
# fonts/subset/manifest.json deliberately and run `bun run test`.
set -euo pipefail
cd "$(dirname "$0")/.."

# Code points and layout features come from the manifest's `unicodes` and `features` values (keep
# both in step; dropping `kern` silently removes kerning).
TEXT='U+0020-007E,U+00A7,U+00A9,U+00B0,U+00B7,U+2013,U+2014,U+2019,U+2026,U+2212'
DISPLAY='U+0020,U+002D,U+0030-0039,U+0041-005A'
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

pyftsubset fonts/full/geist-latin.woff2 --unicodes="$TEXT" --layout-features=liga,tnum,kern \
  --flavor=woff2 --output-file="$tmp/geist.woff2"
fonttools varLib.instancer "$tmp/geist.woff2" wght=400:600 -o fonts/subset/geist.woff2

pyftsubset fonts/full/geist-mono-latin.woff2 --unicodes="$TEXT" \
  --layout-features=dnom,frac,locl,numr --flavor=woff2 --output-file="$tmp/geist-mono.woff2"
fonttools varLib.instancer "$tmp/geist-mono.woff2" wght=400 --static \
  -o fonts/subset/geist-mono.woff2

pyftsubset fonts/full/bricolage-grotesque-latin.woff2 --unicodes="$DISPLAY" \
  --layout-features=dnom,frac,kern,numr --flavor=woff2 --output-file="$tmp/bricolage.woff2"
fonttools varLib.instancer "$tmp/bricolage.woff2" wght=750 wdth=80 --static \
  -o fonts/subset/bricolage-grotesque.woff2

ls -l fonts/subset/*.woff2
