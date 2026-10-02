#!/usr/bin/env bash
# Regenerates fonts/device/*.woff2 from fonts/full with fontTools (subset, then instance),
# matching the amp's cut: same code points, layout features and axis instances.
# Run by hand when the device needs new glyphs, then run `bun run test` for the budget
# and update the sha256 values in fonts/device/manifest.json deliberately.
set -euo pipefail
cd "$(dirname "$0")/.."

TEXT='U+0020-007E,U+00B0,U+00B7,U+2014,U+2212'
DISPLAY='U+0020,U+002D,U+0030-0039,U+0041-005A'
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

pyftsubset fonts/full/geist-latin.woff2 --unicodes="$TEXT" --layout-features=liga,tnum \
  --flavor=woff2 --output-file="$tmp/geist.woff2"
fonttools varLib.instancer "$tmp/geist.woff2" wght=400:600 -o fonts/device/geist.woff2

pyftsubset fonts/full/geist-mono-latin.woff2 --unicodes="$TEXT" \
  --layout-features=dnom,frac,locl,numr --flavor=woff2 --output-file="$tmp/geist-mono.woff2"
fonttools varLib.instancer "$tmp/geist-mono.woff2" wght=400 --static \
  -o fonts/device/geist-mono.woff2

pyftsubset fonts/full/bricolage-grotesque-latin.woff2 --unicodes="$DISPLAY" \
  --layout-features=dnom,frac,numr --flavor=woff2 --output-file="$tmp/bricolage.woff2"
fonttools varLib.instancer "$tmp/bricolage.woff2" wght=750 wdth=80 --static \
  -o fonts/device/bricolage-grotesque.woff2

ls -l fonts/device/*.woff2
