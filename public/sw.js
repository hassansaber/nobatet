/* نوبتت Service Worker — v5 - cPanel Node 24 Ready - Lean & Modern */
const CACHE_NAME = 'nobatet-v5';
const PRECACHE = ['/offline.html', '/icon-192.png', '/icon-512.png'];
const OFFLINE_URL = '/offline.html';

// نصب
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting())
  );
});

// فعال‌سازی - پاک کردن کش قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// پیام skipWaiting از کلاینت
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // فقط same-origin را مدیریت کن (برای cPanel که ممکن است دامنه فرعی داشته باشد)
  if (url.origin !== self.location.origin) return;

  // فایل‌های آپلود و API upload - همیشه network only (مهم برای cPanel)
  if (
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/api/files/') ||
    url.pathname.startsWith('/api/upload') ||
    url.pathname === '/favicon.ico'
  ) {
    event.respondWith(fetch(request).catch(() => new Response('Not found', { status: 404 })));
    return;
  }

  // API - network first با fallback JSON
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          // فقط بعضی GET های کم‌خطر را کش کن
          if (res.ok && request.method === 'GET' && url.pathname.includes('/api/public/')) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, res.clone());
          }
          return res;
        } catch {
          const cached = await caches.match(request);
          return cached || new Response(JSON.stringify({ ok: false, offline: true }), { headers: { 'Content-Type': 'application/json' } });
        }
      })()
    );
    return;
  }

  // Navigation - network first, offline fallback با 503 (URL تغییر نکند)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          return res;
        } catch {
          const cached = await caches.match(OFFLINE_URL);
          if (cached) {
            const body = await cached.text();
            return new Response(body, { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/html; charset=utf-8' } });
          }
          return new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Static - cache first با update در background (stale-while-revalidate ساده)
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const fetchPromise = fetch(request)
        .then((res) => {
          if (res.ok && !url.pathname.includes('/api/')) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);

      return cached || (await fetchPromise) || new Response('', { status: 404 });
    })()
  );
});
