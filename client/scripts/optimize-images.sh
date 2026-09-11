#!/usr/bin/env bash
#
# Resize and compress the site photography.
#
# Camera originals run 3000–7000px wide and several megabytes each. The page
# never displays them wider than about 500 CSS px, so shipping them untouched
# sends 20–25x more pixels than any visitor can see — and this site's whole
# purpose is reaching someone stranded after a crash, often on a phone with
# poor signal.
#
# Originals are kept in site/assets-originals/ and are never modified. This
# script always reads from there and writes into client/public/, so it can be
# re-run safely and is not lossy across repeated runs.
#
# Uses macOS's built-in `sips`. On Linux, substitute ImageMagick:
#   magick in.jpg -resize 1200x -quality 72 -strip out.jpg
#
# Usage:  ./scripts/optimize-images.sh
set -euo pipefail

cd "$(dirname "$0")/.."
SRC="../assets-originals"
DEST="public"

# 1200px covers the largest display size (~500 CSS px) at 2x device pixel ratio,
# and a full-width phone hero at 2x as well.
MAX_WIDTH=1200
QUALITY=72

if [ ! -d "$SRC" ]; then
  echo "No $SRC directory — nothing to optimize."
  exit 0
fi

shopt -s nullglob
for src in "$SRC"/*.jpg "$SRC"/*.jpeg "$SRC"/*.png; do
  name="$(basename "$src")"
  out="$DEST/$name"

  before=$(stat -f%z "$src")
  sips -Z "$MAX_WIDTH" "$src" --out "$out" >/dev/null
  # -s format jpeg re-encodes PNGs too; formatOptions is the JPEG quality.
  sips -s format jpeg -s formatOptions "$QUALITY" "$out" --out "$out" >/dev/null
  after=$(stat -f%z "$out")

  w=$(sips -g pixelWidth "$out" | awk '/pixelWidth/{print $2}')
  h=$(sips -g pixelHeight "$out" | awk '/pixelHeight/{print $2}')
  dims="${w}x${h}"
  printf '%-22s %6.1f MB -> %6.0f KB  (%s)  %d%% smaller\n' \
    "$name" "$(echo "$before/1048576" | bc -l)" "$(echo "$after/1024" | bc -l)" \
    "$dims" "$(( 100 - after * 100 / before ))"
done
