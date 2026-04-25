// Break-glass SW: stop caching app shell to prevent blank screens
// from stale index.html referencing missing asset hashes.
const CACHE_NAME = 'apriq-v3';

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never intercept API/auth or non-GET requests
  if (
    e.request.method !== 'GET' ||
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/api/')
  ) return;

  // Network-only for navigations (SPA). If offline, let it fail normally.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request));
    return;
  }

  // Network-first for assets; if offline, try cache (which we clear on activate).
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
