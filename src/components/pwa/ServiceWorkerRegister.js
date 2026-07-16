'use client';

import { useEffect } from 'react';

/**
 * ثبت Service Worker برای PWA
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // فقط production یا وقتی صریحاً فعال باشد
    const enable =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_SW === 'true';
    if (!enable) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.info('[pwa] SW registered', reg.scope);
      })
      .catch((err) => {
        console.warn('[pwa] SW failed', err);
      });
  }, []);

  return null;
}
