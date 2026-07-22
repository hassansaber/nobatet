'use client';

import { useEffect } from 'react';

/**
 * PWA Service Worker - نسخه مدرن شده برای cPanel Node 24
 * - ثبت خودکار
 * - بررسی آپدیت هر 60 ثانیه
 * - پیام skipWaiting برای آپدیت فوری
 * - لاگ ساده برای دیباگ در cPanel
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const enable =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

    if (!enable) {
      // در dev، اگر قبلا SW ثبت شده، حذف کن تا کش اذیت نکند
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister().catch(() => {}));
      });
      return;
    }

    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.info('[pwa] registered', reg.scope);

        // بررسی آپدیت هر 60 ثانیه
        setInterval(() => {
          reg.update().catch(() => {});
        }, 60 * 1000);

        // اگر SW جدید در حالت waiting بود
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // نسخه جدید آماده است
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      } catch (err) {
        console.warn('[pwa] failed', err);
      }
    };

    // ثبت بعد از load برای عدم بلوکه کردن
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  return null;
}
