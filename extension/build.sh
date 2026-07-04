#!/usr/bin/env bash
# Assemble dist-chrome/ and dist-firefox/ from src/ by copying everything and
# swapping in the per-browser manifest. No bundler — plain file copy.
# The Chrome build excludes the Google fallback entirely: the Chrome package is
# on-device-only (as the store listing claims), so the code isn't shipped.
set -euo pipefail
cd "$(dirname "$0")"

SRC=src
for browser in chrome firefox; do
  OUT="dist-$browser"
  rm -rf "$OUT"
  mkdir -p "$OUT"
  if [ "$browser" = chrome ]; then
    rsync -a --exclude 'manifest.*.json' --exclude '.DS_Store' \
      --exclude 'lib/providers-google.js' "$SRC"/ "$OUT"/
  else
    rsync -a --exclude 'manifest.*.json' --exclude '.DS_Store' "$SRC"/ "$OUT"/
  fi
  cp "$SRC/manifest.$browser.json" "$OUT/manifest.json"
  echo "built $OUT"
done
