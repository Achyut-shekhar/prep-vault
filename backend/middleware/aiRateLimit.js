const WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60000);
const MAX_REQUESTS = Number(process.env.AI_RATE_LIMIT_MAX || 10);

const requestStore = new Map();

const getBucket = (key, now) => {
  const existing = requestStore.get(key);
  if (!existing || now > existing.resetAt) {
    const fresh = {
      count: 0,
      resetAt: now + WINDOW_MS,
    };
    requestStore.set(key, fresh);
    return fresh;
  }

  return existing;
};

const aiRateLimit = (req, res, next) => {
  const userId = req.user?.userId || "anonymous";
  const key = `${userId}:${req.path}`;
  const now = Date.now();

  const bucket = getBucket(key, now);
  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      error: "Too many AI requests. Please try again shortly.",
      retryAfterSeconds,
      limit: MAX_REQUESTS,
      windowMs: WINDOW_MS,
    });
  }

  res.setHeader("X-RateLimit-Limit", String(MAX_REQUESTS));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, MAX_REQUESTS - bucket.count)));
  res.setHeader("X-RateLimit-Reset", String(Math.floor(bucket.resetAt / 1000)));

  return next();
};

module.exports = aiRateLimit;
