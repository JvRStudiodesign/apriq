// api/_rate-limit.js — simple in-memory rate limiter for Vercel serverless
// Note: resets on cold start. For production, use Vercel KV or Upstash Redis.
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

export function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.socket?.remoteAddress
      || 'unknown';
}
