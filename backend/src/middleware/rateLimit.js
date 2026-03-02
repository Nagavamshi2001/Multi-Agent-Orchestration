const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 60; // 60 requests per window

// Simple in-memory sliding window rate limiter.
// Keyed by authenticated user id when available, otherwise by IP.
const buckets = new Map();

export const rateLimit = (options = {}) => {
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;
  const max = options.max || DEFAULT_MAX_REQUESTS;

  return (req, res, next) => {
    const key = req.user?.id || req.ip || 'anon';
    const now = Date.now();
    const windowStart = now - windowMs;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
    }

    // Drop timestamps outside the current window
    while (bucket.length && bucket[0] < windowStart) {
      bucket.shift();
    }

    if (bucket.length >= max) {
      return res.status(429).json({ error: 'Too many requests, please slow down.' });
    }

    bucket.push(now);
    return next();
  };
};

