// api/_rate-limit.js
// Default: simple in-memory rate limiter (resets on cold start).
// If Upstash env vars exist, use `rateLimitAsync()` for a persistent limiter.

const requests = new Map();

export function rateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const key = identifier;
  const entry = requests.get(key);

  if (!entry || now - entry.firstRequest > windowMs) {
    requests.set(key, { count: 1, firstRequest: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.firstRequest + windowMs - now) / 1000) };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

export async function rateLimitAsync(identifier, maxRequests = 10, windowMs = 60000) {
  const canUseUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!canUseUpstash) return rateLimit(identifier, maxRequests, windowMs);

  try {
    const { Redis } = await import('@upstash/redis');
    const { Ratelimit } = await import('@upstash/ratelimit');
    const redis = Redis.fromEnv();
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${Math.max(1, Math.floor(windowMs / 1000))} s`),
      analytics: false,
    });
    const out = await rl.limit(identifier);
    return {
      allowed: !!out.success,
      remaining: typeof out.remaining === 'number' ? out.remaining : 0,
      retryAfter: out.reset ? Math.ceil((out.reset - Date.now()) / 1000) : undefined,
    };
  } catch {
    return rateLimit(identifier, maxRequests, windowMs);
  }
}

export function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.socket?.remoteAddress
      || 'unknown';
}
