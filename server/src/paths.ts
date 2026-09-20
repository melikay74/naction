import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * site/ root. In dev this file is site/server/src/paths.ts; after `tsc` it is
 * site/server/dist/paths.js. Both are two levels below site/server.
 */
export const SITE_ROOT = path.resolve(here, '..', '..');

/**
 * Where partners.json and applications.json live.
 *
 * Override with NACTION_DATA_DIR in production and point it OUTSIDE the deploy
 * directory. Most shared hosts replace the app folder wholesale on redeploy,
 * which would erase every partner application received since the last one — and
 * overwrite the real partner directory with whatever shipped in the bundle.
 */
export const DATA_DIR = process.env.NACTION_DATA_DIR
  ? path.resolve(process.env.NACTION_DATA_DIR)
  : path.join(SITE_ROOT, 'data');
export const PARTNERS_FILE = path.join(DATA_DIR, 'partners.json');
export const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');
/**
 * Partner logos, served at /logos/. Kept beside partners.json rather than in
 * the client build so a new logo is an upload, not a rebuild and redeploy.
 */
export const LOGOS_DIR = path.join(DATA_DIR, 'logos');
export const CLIENT_DIST = path.join(SITE_ROOT, 'client', 'dist');
