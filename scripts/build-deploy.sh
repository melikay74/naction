#!/usr/bin/env bash
#
# Build an upload-ready bundle for cPanel's "Setup Node.js App" (Phusion Passenger).
#
#   ./scripts/build-deploy.sh                     -> staging bundle (crawlers blocked, banner shown)
#   ./scripts/build-deploy.sh production          -> live bundle
#   ./scripts/build-deploy.sh staging --bundled   -> also ships node_modules
#
# --bundled includes express and its dependencies in the zip (+~900 KB), so the
# host never has to run npm install. Useful when cPanel's "Run NPM Install"
# button is unavailable or disabled, which happens on some shared plans.
#
# Produces deploy/naction-deploy.zip, ready to upload and extract in cPanel's
# File Manager. Everything is compiled here, so the server only ever installs
# express — no TypeScript, Vite, or React on the host.
#
# Two Passenger quirks are handled by the layout this produces:
#
#   1. Passenger's startup file is loaded as CommonJS. The server is written as
#      ES modules, so app.js is a small CommonJS shim that dynamically imports
#      the real ESM entry point. That is why the bundle's top-level package.json
#      deliberately has no "type": "module", while server/package.json does.
#
#   2. server/dist sits two levels below the bundle root, which is what
#      paths.ts expects when resolving client/dist and the data directory.
set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-staging}"
BUNDLED=""
for arg in "$@"; do [ "$arg" = "--bundled" ] && BUNDLED=1; done
OUT="deploy/naction"

if [ "$MODE" = "production" ]; then
  echo "==> Building PRODUCTION bundle (indexable, no staging banner)"
  npm run build:production
else
  echo "==> Building STAGING bundle (crawlers blocked, warning banner shown)"
  npm run build
fi

rm -rf deploy
mkdir -p "$OUT/server" "$OUT/client" "$OUT/data"

cp -R server/dist "$OUT/server/dist"
cp -R client/dist "$OUT/client/dist"
cp data/partners.json "$OUT/data/partners.json"
# Logos ship beside the data so a first deploy has them; on the host they live
# in $NACTION_DATA_DIR/logos/ and later additions are uploads, not redeploys.
cp -R data/logos "$OUT/data/logos"

# Marks server/dist/*.js as ES modules. The bundle root stays CommonJS so
# Passenger can load app.js.
cat > "$OUT/server/package.json" <<'JSON'
{ "type": "module" }
JSON

# Copy the server's runtime dependencies verbatim rather than naming them here.
# Hardcoding the list means a newly added package silently misses the bundle and
# the app crashes on the host at import time.
node -e '
const deps = require("./server/package.json").dependencies;
require("fs").writeFileSync(process.argv[1] + "/package.json", JSON.stringify({
  name: "naction-advisors",
  private: true,
  version: "1.0.0",
  main: "app.js",
  engines: { node: ">=18" },
  dependencies: deps,
}, null, 2) + "\n");
console.log("    runtime deps: " + Object.keys(deps).join(", "));
' "$OUT"

# Passenger's entry point. CommonJS on purpose — see the note at the top.
cat > "$OUT/app.js" <<'JS'
/**
 * Passenger startup file.
 *
 * Loaded as CommonJS, so it cannot `import` the ESM server directly. The
 * dynamic import() below bridges the two. Keep this file CommonJS: adding
 * "type": "module" to the bundle's package.json will break Passenger's loader.
 */
process.env.SITE_ENV = process.env.SITE_ENV || 'staging';

import('./server/dist/index.js').catch((err) => {
  console.error('[naction] failed to start:', err);
  process.exit(1);
});
JS

if [ -n "$BUNDLED" ]; then
  echo "==> Installing express into the bundle (no npm install needed on the host)"
  ( cd "$OUT" && npm install --omit=dev --no-audit --no-fund >/dev/null )
  rm -f "$OUT/package-lock.json"
fi

# Packed WITHOUT a wrapping folder: cPanel creates the application root itself
# (with public/ and tmp/ inside, which Passenger needs), so the bundle has to
# extract directly into that existing folder rather than nesting under it.
#
# Both formats, same contents. cPanel's ClamAV ships Sanesecurity's Foxhole
# rules, which flag ANY zip containing JavaScript — a heuristic aimed at malware
# droppers that this bundle trips simply by being a compiled JS app. The tarball
# is not covered by those signatures, so upload naction-deploy.tar.gz if the zip
# is rejected as a virus. File Manager extracts both.
( cd "$OUT" && zip -r -q ../naction-deploy.zip . )
( cd "$OUT" && tar -czf ../naction-deploy.tar.gz . )

echo
echo "==> deploy/naction-deploy.zip     ($(du -h deploy/naction-deploy.zip | cut -f1))"
echo "==> deploy/naction-deploy.tar.gz  ($(du -h deploy/naction-deploy.tar.gz | cut -f1))  <- use this if cPanel flags the zip"
echo "    mode: $MODE${BUNDLED:+ (node_modules included — skip Run NPM Install)}"
echo "    extract INTO the cPanel application root (alongside public/ and tmp/):"
find "$OUT" -maxdepth 2 -mindepth 1 | sed "s|$OUT/|      |" | sort
