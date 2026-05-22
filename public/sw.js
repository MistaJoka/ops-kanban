// This app is not a PWA. Browsers may still request /sw.js from a stale registration.
// Serve a no-op worker that unregisters quietly — no cache, no forced reloads.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.registration.unregister());
});

self.addEventListener('fetch', (event) => {
  // Pass through; never intercept network requests.
  return;
});
