/* نوبتت Service Worker — v3 - bypass uploads & api files + new cache */
const CACHE = 'nobatet-v3';
const PRECACHE = [
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(()=>{}))
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

  // Critical: Never cache uploads or api/files or favicon - always network only
  // Fixes: upload POST 200 but GET 404 from service worker returning cached 404
  if (
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/api/files/') ||
    url.pathname.startsWith('/api/upload') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/icon.png' ||
    url.pathname === '/apple-icon.png'
  ) {
    event.respondWith(
      fetch(request).then((res) => {
        // Don't cache, just return
        return res;
      }).catch(() => {
        return new Response('File not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
      })
    );
    return;
  }

  // API: network-first, no aggressive caching - only cache bookings list slightly
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

  // Static assets: cache-first with freshness check
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    // Only cache same-origin OK responses, not html navigations
    if (res.ok && request.url.startsWith(self.location.origin) && !request.url.includes('/api/')) {
      const cache = await caches.open(CACHE);
      // Don't cache favicon if old
      if (!request.url.endsWith('favicon.ico')) {
        cache.put(request, res.clone());
      }
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
