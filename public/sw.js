// Break-glass SW: unregister itself to stop client-side caching issues.
// This removes a major source of "flash then white screen" caused by stale app shell.
const CACHE_NAME = 'apriq-v4';

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => Promise.all(clients.map((c) => c.navigate(c.url))))
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
