/* نوبتت Service Worker — v4 - fixed offline redirect bug */
const CACHE = 'nobatet-v4';
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

  // Never cache uploads or api/files or favicon - always network only
  if (
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/api/files/') ||
    url.pathname.startsWith('/api/upload') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/icon.png' ||
    url.pathname === '/apple-icon.png'
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response('File not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
      })
    );
    return;
  }

  // API: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigations: network-first, but only fallback to offline.html if truly offline and same-origin
  // Fix: do not return offline.html response that would cause URL to become /offline.html
  // Instead, if fetch fails, try network again, then return offline.html content with 200 but keep original URL via Response
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If server returns offline.html redirect? No, just return response as is (even if 404, let Next handle)
          return response;
        })
        .catch(async () => {
          // Only if offline, return offline page content directly (not cached response that would change URL)
          const cached = await caches.match('/offline.html');
          if (cached) {
            // Clone body to avoid cache lock
            const body = await cached.text();
            return new Response(body, {
              status: 503,
              statusText: 'Offline',
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          }
          return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }),
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
    if (res.ok && request.url.startsWith(self.location.origin) && !request.url.includes('/api/')) {
      const cache = await caches.open(CACHE);
      if (!request.url.endsWith('favicon.ico') && !request.url.endsWith('offline.html')) {
        cache.put(request, res.clone());
      }
    }
    return res;
  } catch {
    // Don't return offline.html for assets
    return fetch(request);
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
