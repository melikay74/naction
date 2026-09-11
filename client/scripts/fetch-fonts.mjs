import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = process.argv[2];
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// Only the latin subsets — a California audience needs no cyrillic/vietnamese.
const KEEP = new Set(['latin', 'latin-ext']);

const SOURCES = [
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  // Script face for the brand wordmark in the header. Single weight by design.
  'https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap',
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * font-display per family.
 *
 * Body text uses `swap`: showing readable text in a fallback immediately beats
 * showing nothing, and the substitution is barely noticeable at body sizes.
 *
 * Alex Brush, the brand wordmark, uses `block` instead: a script face replaced
 * by a sans is a jarring, obvious flicker, so it stays invisible for a brief
 * period and then paints correctly the first time. It is preloaded in
 * index.html, so on any normal connection that period is imperceptible.
 */
const DISPLAY = { 'alex-brush': 'block' };
const displayFor = (family) => DISPLAY[slug(family)] ?? 'swap';

await fs.mkdir(OUT, { recursive: true });

const faces = [];
const downloads = new Map();

for (const url of SOURCES) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`);
  const css = await res.text();

  // Google emits `/* subset */` immediately before each @font-face block.
  const chunks = css.split(/\/\*\s*([a-z-]+)\s*\*\//).slice(1);

  for (let i = 0; i < chunks.length; i += 2) {
    const subset = chunks[i];
    const block = chunks[i + 1];
    if (!KEEP.has(subset)) continue;

    const family = block.match(/font-family:\s*['"]([^'"]+)['"]/)?.[1];
    const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
    const src = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!family || !weight || !src) continue;

    const file = `${slug(family)}-${weight}-${subset}.woff2`;
    if (downloads.has(file) && downloads.get(file) !== src) {
      throw new Error(`filename collision on ${file}`);
    }
    downloads.set(file, src);

    const body = block
      .slice(block.indexOf('{') + 1, block.lastIndexOf('}'))
      .replace(/url\(https:[^)]+\)/, `url(/fonts/${file})`)
      .replace(/font-display:\s*\w+/, `font-display: ${displayFor(family)}`)
      .trimEnd();
    faces.push(`@font-face {${body}\n}`);
  }
}

for (const [file, url] of downloads) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`font download failed ${res.status} for ${file}`);
  await fs.writeFile(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
}

/*
 * Metric-matched fallbacks.
 *
 * `swap` still means the fallback paints first and the webfont replaces it. If
 * the two occupy different space, that replacement reflows the text and reads as
 * a flicker. These synthetic faces wrap Arial and stretch it to each webfont's
 * exact metrics, so the substitution changes glyph shapes without moving
 * anything — the swap stops being noticeable.
 *
 * Ratios measured in-browser: rendered advance width and font bounding box of
 * each webfont against Arial at 100px. `size-adjust` matches width; the
 * ascent/descent overrides are the webfont's values divided by that adjustment,
 * so they land correctly after scaling. Re-measure if a family changes.
 */
const FALLBACKS = [
  { family: 'Plus Jakarta Sans', sizeAdjust: 105.32, ascent: 98.75, descent: 20.89 },
];

const fallbackFaces = FALLBACKS.map(
  ({ family, sizeAdjust, ascent, descent }) => `@font-face {
  font-family: '${family} Fallback';
  src: local('Arial'), local('Helvetica'), local('Liberation Sans');
  size-adjust: ${sizeAdjust}%;
  ascent-override: ${ascent}%;
  descent-override: ${descent}%;
  line-gap-override: 0%;
}`,
);

const header = `/* Self-hosted webfonts — latin subsets only.
 *
 * Generated from the Google Fonts CSS, with the .woff2 files copied into
 * client/public/fonts/. Serving them ourselves means the site makes no
 * third-party requests at all, so no visitor IP is disclosed to Google and
 * there is nothing here for a consent banner to gate.
 *
 * Linked directly from index.html — never @imported from another stylesheet,
 * which would put the font request behind the JS bundle and bring the flash of
 * unstyled text back.
 *
 * To change weights: edit and re-run scripts/fetch-fonts.mjs.
 */\n\n`;

const fallbackHeader = `\n/* ── Metric-matched fallbacks ───────────────────────────────────────────────
 * Arial, stretched to each webfont's measured metrics so the swap does not
 * reflow the page. Use them in the font stack directly after the real family:
 *   font-family: 'Plus Jakarta Sans', 'Plus Jakarta Sans Fallback', system-ui, sans-serif;
 * ───────────────────────────────────────────────────────────────────────── */\n\n`;

await fs.writeFile(
  path.join(OUT, 'fonts.css'),
  header + faces.join('\n') + '\n' + fallbackHeader + fallbackFaces.join('\n\n') + '\n',
);

console.log(`families: ${new Set([...downloads.keys()].map((f) => f.replace(/-\d+-.*/, ''))).size}`);
console.log(`faces: ${faces.length}, files: ${downloads.size}`);
console.log([...downloads.keys()].join('\n'));
