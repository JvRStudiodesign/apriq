// Self-unregistering kill-switch service worker.
//
// We don't need a service worker for this app, and we have evidence that a
// previously-registered SW (or a stale older version) interferes with POST
// navigations to https://www.payfast.co.za. This file replaces any existing
// SW with one that:
//   1. Skips waiting and claims clients immediately,
//   2. Deletes every cache it finds,
//   3. Unregisters itself,
//   4. Reloads the controlled tabs so they stop being SW-controlled.
// After the user loads the site once, the SW is gone for good. Future
// deploys can keep this file as-is — it's idempotent.
const KILL_VERSION = 'apriq-killswitch-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) { /* ignore */ }

    try {
      await self.registration.unregister();
    } catch (_) { /* ignore */ }

    try {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        try { client.navigate(client.url); } catch (_) { /* ignore */ }
      }
    } catch (_) { /* ignore */ }
  })());
});

// While alive, never intercept anything. Let every request pass through.
self.addEventListener('fetch', () => { /* no-op */ });
