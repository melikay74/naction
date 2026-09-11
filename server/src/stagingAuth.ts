import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

/**
 * HTTP Basic auth for staging deploys.
 *
 * The staging site runs on the real domain with placeholder partner data —
 * fictional businesses and 555 phone numbers. noindex keeps it out of search
 * results, but anyone who types the domain would still land on it. A password
 * makes it genuinely private, which matters when the fake data looks like
 * emergency contacts.
 *
 * Enabled only when STAGING_PASSWORD is set, so it can be lifted without a
 * redeploy by clearing the variable and restarting.
 */

/** Constant-time compare that also tolerates differing lengths. */
function matches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still compare something of equal length so the timing doesn't leak length.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function stagingAuth(password: string, user = 'preview'): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization ?? '';
    const [scheme, encoded] = header.split(' ');

    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      const givenUser = decoded.slice(0, separator);
      const givenPass = decoded.slice(separator + 1);

      // Evaluate both so a wrong username costs the same time as a wrong password.
      const userOk = matches(givenUser, user);
      const passOk = matches(givenPass, password);
      if (userOk && passOk) return next();
    }

    // ASCII only: a non-ASCII character here (an em dash, say) makes Node throw
    // ERR_INVALID_CHAR, which turns the 401 challenge into a 500 and stops the
    // browser ever showing a login prompt.
    res.setHeader('WWW-Authenticate', 'Basic realm="NAction Advisors staging preview"');
    res.status(401).type('text/plain').send('This preview is password protected.');
  };
}
