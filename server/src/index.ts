import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { CLIENT_DIST, LOGOS_DIR, SITE_ROOT } from './paths.js';
import { searchPartners } from './partners.js';
import { regionLabelForZip } from './regions.js';
import { saveApplication } from './applications.js';
import { emailDiagnostics, sendApplicationEmails, verifyEmail } from './email.js';
import { rateLimit } from './rateLimit.js';
import { stagingAuth } from './stagingAuth.js';
import { ValidationError, parseApplication, parseCategories, parseInteger, parseZip } from './validate.js';
import type { PartnerSearchResponse } from './types.js';

const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 3011);

/**
 * Staging deploys carry placeholder partner data — fictional businesses with
 * 555 phone numbers. Getting that indexed would put fake emergency contacts in
 * front of real people searching for help, so staging is walled off from crawlers.
 * Set SITE_ENV=production only once the real directory is in place.
 */
const IS_STAGING = process.env.SITE_ENV !== 'production';

const app = express();

app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));

if (IS_STAGING) {
  // A header, not just a meta tag: it covers the API and every asset too, and
  // needs no cooperation from the HTML.
  app.use((_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    next();
  });

  // Optional password gate, for when staging has to live on the real domain.
  // Placed before every route so the API and assets are covered too.
  const password = process.env.STAGING_PASSWORD;
  if (password) {
    app.use(stagingAuth(password, process.env.STAGING_USER ?? 'preview'));
  }
}

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(IS_STAGING ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n');
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

/**
 * Mail diagnostics — staging only, and deliberately redacted.
 *
 * Shared hosting makes server logs awkward to read (rotated and gzipped), so
 * this reports the same thing the boot check does, in a browser. It disappears
 * entirely once SITE_ENV=production.
 */
if (IS_STAGING) {
  app.get('/api/diagnostics/email', async (_req, res, next) => {
    try {
      res.json(await emailDiagnostics());
    } catch (err) {
      next(err);
    }
  });
}

/**
 * Partner search. One endpoint serves both the initial search (several
 * categories, offset 0) and a "load more" click (one category, that column's
 * current offset).
 */
app.get('/api/partners', async (req, res, next) => {
  try {
    const zip = parseZip(req.query.zip);
    const categories = parseCategories(req.query.categories);
    const limit = parseInteger(req.query.limit, 5, 1, 25);
    const offset = parseInteger(req.query.offset, 0, 0, 1000);

    const payload: PartnerSearchResponse = {
      zip,
      regionLabel: regionLabelForZip(zip),
      results: await searchPartners(zip, categories, limit, offset),
    };
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

app.post('/api/apply', rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }), async (req, res, next) => {
  try {
    const input = parseApplication(req.body);
    const application = await saveApplication(input);

    // Answer as soon as the application is safely on disk. Email is a
    // notification layered on top of the saved record, so a mail outage must
    // never cost an application or show the applicant an error for something
    // that actually succeeded.
    res.status(201).json({ ok: true, id: application.id });

    void sendApplicationEmails(application);
  } catch (err) {
    next(err);
  }
});

// Partner logos come from the data directory, not the client build, so adding
// one is an upload rather than a redeploy. Vite proxies /logos here in dev.
app.use('/logos', express.static(LOGOS_DIR, { maxAge: '1d', index: false }));

// Serve the built client in production; in dev, Vite serves it and proxies /api here.
if (fs.existsSync(CLIENT_DIST)) {
  /**
   * ACME domain-validation files, served from the app root's public/ folder.
   *
   * Must come before the SPA fallback. Answering an AutoSSL challenge with
   * index.html looks like a 200 to cPanel but contains the wrong body, so
   * validation fails and no HTTPS certificate is ever issued — with no obvious
   * error to explain why.
   */
  app.use(
    '/.well-known',
    express.static(path.join(SITE_ROOT, 'public', '.well-known'), { dotfiles: 'allow' }),
  );

  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    // Anything unresolved under /.well-known is a genuine 404, never the SPA.
    if (req.path.startsWith('/.well-known/')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }
  next();
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message, field: err.field });
    return;
  }
  console.error('[naction] unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`[naction] API listening on http://localhost:${PORT}`);
  void verifyEmail();
  if (IS_STAGING) {
    console.log(
      '[naction] STAGING mode — search engines blocked (X-Robots-Tag + robots.txt). ' +
        'Set SITE_ENV=production to go live.',
    );
    console.log(
      process.env.STAGING_PASSWORD
        ? `[naction] Password protected (user "${process.env.STAGING_USER ?? 'preview'}").`
        : '[naction] No STAGING_PASSWORD set — the preview is reachable by anyone with the URL.',
    );
  }
});
