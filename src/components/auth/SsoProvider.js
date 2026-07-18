'use client';

import { useEffect } from 'react';

/**
 * SsoProvider - همگام‌سازی خودکار سشن بین دامنه اصلی و ساب‌دامین‌ها
 * 
 * فلسفه:
 * - در پروداکشن با Domain=.nobatet.com یک کوکی مشترک داریم، پس SSO خودکار است و این کامپوننت فقط یک health-check است
 * - در لوکال‌هاست (localhost) چون Domain=localhost توسط مرورگر رد می‌شود، هر host کوکی جدا (host-only) دارد
 *   بنابراین نیاز به sync صریح داریم:
 *   1) اگر روی tenant هستیم و local session نداریم اما main دارد → token را از main بگیر و روی tenant ست کن
 *   2) اگر روی tenant لاگین کردیم → token را به main هم پوش کن تا وقتی به main برمی‌گردیم لاگین بمانیم
 * 
 * این کامپوننت باید در layout اصلی (و همچنین در tenant page اگر ممکن باشد) قرار گیرد
 */

export function SsoProvider() {
  useEffect(() => {
    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) return;

    const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    let mainOrigin;
    try {
      mainOrigin = new URL(mainAppUrl).origin;
    } catch {
      mainOrigin = 'http://localhost:3001';
    }

    const currentOrigin = window.location.origin;
    const currentHost = window.location.hostname;
    const isMainHost = currentOrigin === mainOrigin || currentHost === 'localhost' || currentHost === '127.0.0.1';

    // برای جلوگیری از لوپ، فقط یک بار اجرا بعد از 800ms
    const timeout = setTimeout(async () => {
      try {
        // اگر روی tenant هستیم
        if (!isMainHost) {
          // 1. چک کن آیا روی همین host لاگین هستیم؟
          let localLoggedIn = false;
          try {
            const localMe = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
            if (localMe.ok) {
              const j = await localMe.json().catch(() => ({}));
              if (j.ok) localLoggedIn = true;
            }
          } catch {}

          if (!localLoggedIn) {
            // 2. از main بپرس آیا لاگین هست؟
            try {
              const mainMeRes = await fetch(`${mainOrigin}/api/auth/me`, {
                credentials: 'include',
                cache: 'no-store',
                mode: 'cors',
              });
              if (mainMeRes.ok) {
                const mainMe = await mainMeRes.json().catch(() => ({}));
                if (mainMe.ok) {
                  // main لاگین دارد → token بگیر و sync کن روی tenant فعلی
                  const tokenRes = await fetch(`${mainOrigin}/api/auth/token`, {
                    credentials: 'include',
                    cache: 'no-store',
                    mode: 'cors',
                  });
                  if (tokenRes.ok) {
                    const tokenJson = await tokenRes.json().catch(() => ({}));
                    if (tokenJson.ok && tokenJson.token) {
                      await fetch('/api/auth/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ token: tokenJson.token }),
                      });
                      // بعد از sync یک بار رفرش نرم بزن تا header آپدیت شود
                      // ولی نه حتما، چون TenantHeader دوباره me را می‌گیرد
                      window.dispatchEvent(new Event('nobatet:sso-synced'));
                    }
                  }
                }
              }
            } catch (e) {
              console.debug('[SsoProvider] main->tenant sync failed', e?.message);
            }
          } else {
            // روی tenant لاگین هستیم، اطمینان حاصل کن main هم لاگین دارد (برای خروج روان و برگشت به هوم)
            // این را فقط اگر قبلا sync نکرده باشیم انجام بده
            const alreadyPushed = sessionStorage.getItem('nobatet_sso_pushed_to_main');
            if (!alreadyPushed) {
              try {
                const tokenRes = await fetch('/api/auth/token', { credentials: 'include', cache: 'no-store' });
                if (tokenRes.ok) {
                  const tokenJson = await tokenRes.json().catch(() => ({}));
                  if (tokenJson.ok && tokenJson.token) {
                    await fetch(`${mainOrigin}/api/auth/sync`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      mode: 'cors',
                      body: JSON.stringify({ token: tokenJson.token }),
                    });
                    sessionStorage.setItem('nobatet_sso_pushed_to_main', '1');
                  }
                }
              } catch (e) {
                console.debug('[SsoProvider] tenant->main push failed', e?.message);
              }
            }
          }
        } else {
          // روی main هستیم
          // اگر کاربر از tenant به main برگشته، احیانا tenant لاگین دارد ولی main ندارد؟ این حالت نادر است
          // ولی ما نمی‌توانیم بدانیم کدام tenant؛ پس کاری نمی‌کنیم.
          // فقط یک event برای پاک کردن flag push
          sessionStorage.removeItem('nobatet_sso_pushed_to_main');
        }

        // ذخیره host جاری در localStorage برای logout گسترده در localhost
        try {
          const key = 'nobatet_visited_hosts';
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (!list.includes(currentOrigin)) {
            list.push(currentOrigin);
            // نگه دار آخرین 10 تا
            localStorage.setItem(key, JSON.stringify(list.slice(-10)));
          }
        } catch {}
      } catch {}
    }, 600);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
