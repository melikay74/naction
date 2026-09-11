import type { RequestHandler } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Minimal in-memory fixed-window limiter. Enough to blunt casual form spam;
 * it resets on restart and does not span multiple server instances. Swap for a
 * shared store if this is ever deployed behind more than one process.
 */
export function rateLimit(options: { windowMs: number; max: number }): RequestHandler {
  const buckets = new Map<string, Bucket>();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';

    // Opportunistic sweep so the map cannot grow without bound.
    if (buckets.size > 5000) {
      for (const [k, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(k);
      }
    }

    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (bucket.count >= options.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many submissions from this address. Please try again later, or call us.',
      });
      return;
    }

    bucket.count += 1;
    next();
  };
}
