#!/usr/bin/env bash
#
# Build an upload-ready bundle for cPanel's "Setup Node.js App" (Phusion Passenger).
#
#   ./scripts/build-deploy.sh                     -> staging bundle (crawlers blocked, banner shown)
#   ./scripts/build-deploy.sh production          -> live bundle
#   ./scripts/build-deploy.sh staging --slim      -> omit node_modules (needs npm install on the host)
#
# node_modules ships INSIDE the bundle by default (+~4 MB), so the host never
# has to run npm install and deploying is upload-extract-restart, always.
#
# That default was chosen the hard way. A slim bundle declares its dependencies
# but ships none, so adding a package and uploading without clicking "Run NPM
# Install" leaves the host missing it and Passenger cannot boot — which is how
# `stripe` once took the whole site down with a 503. The failure is silent at
# build time and total at run time, and it costs 4 MB to make impossible.
#
# --slim restores the old behaviour. Worth it only if upload size genuinely
# matters; it puts the npm install step back on you, every single deploy.
#
# Produces deploy/naction-deploy.zip, ready to upload and extract in cPanel's
# File Manager. Everything is compiled here — no TypeScript, Vite, or React on
# the host.
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
# Bundled by default — see the note at the top. --bundled is still accepted so
# older notes and muscle memory keep working; it is now a no-op.
BUNDLED=1
for arg in "$@"; do [ "$arg" = "--slim" ] && BUNDLED=""; done
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
  echo "==> Installing server dependencies into the bundle (no npm install needed on the host)"
  # This is the one step that needs the network. Failing here must be loud and
  # must stop the build: a half-installed node_modules that still zips cleanly
  # is exactly the silent breakage bundling exists to prevent.
  if ! ( cd "$OUT" && npm install --omit=dev --no-audit --no-fund >/dev/null ); then
    echo
    echo "    npm install failed, so the bundle has no node_modules and is NOT safe to upload." >&2
    echo "    Check your network and run it again, or build with --slim and click" >&2
    echo "    Run NPM Install on the host instead." >&2
    rm -rf deploy
    exit 1
  fi
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
echo "    mode: $MODE"
DEPS="$(node -p "Object.keys(require('./server/package.json').dependencies||{}).join(', ')")"
if [ -n "$BUNDLED" ]; then
  echo "    deps:  $DEPS (shipped in the bundle — no Run NPM Install needed)"
else
  # Slim bundles declare dependencies but ship none, so a package the host has
  # never installed stops Passenger booting. This warning is the cheapest place
  # to catch that: it is read on every build, unlike DEPLOY.md.
  echo "    deps:  $DEPS  — NOT shipped (--slim)"
  echo "      ^ if that list changed since your last upload, click Run NPM Install BEFORE Restart"
fi
echo "    extract INTO the cPanel application root (alongside public/ and tmp/):"
# node_modules' own children are noise now that bundling is the default; the
# folder itself still shows, so it is obvious the dependencies are in there.
find "$OUT" -maxdepth 2 -mindepth 1 | grep -v "^$OUT/node_modules/." | sed "s|$OUT/|      |" | sort
