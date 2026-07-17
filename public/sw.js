/* نوبتت Service Worker — cache-first for shell, network-first for API */
const CACHE = 'nobatet-v1';
const PRECACHE = [
  '/',
  '/demo',
  '/login',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Don't intercept uploads - always network only (fixes 404 after upload)
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response('File not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
      })
    );
    return;
  }

  // API: network-first, fallback cache for read endpoints
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigations: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html').then((r) => r || caches.match('/')),
      ),
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    const cache = await caches.open(CACHE);
    if (res.ok && request.url.startsWith(self.location.origin)) {
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return caches.match('/offline.html');
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok && request.url.includes('/api/me/bookings')) {
      const cache = await caches.open(CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    return (
      cached ||
      new Response(JSON.stringify({ ok: false, offline: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
}
