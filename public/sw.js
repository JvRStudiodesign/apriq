const CACHE_NAME = 'apriq-v1';
const SHELL = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-transparent.png',
];

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API/auth, cache-first for static assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always use network for Supabase, API calls, and non-GET requests
  if (
    e.request.method !== 'GET' ||
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/api/')
  ) {
    return; // let browser handle normally
  }

  // For navigation (HTML pages), try network first, fall back to cached /index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // For JS/CSS/fonts/images: cache-first, revalidate in background
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
