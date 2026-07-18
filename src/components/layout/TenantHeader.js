'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, LayoutDashboard, LogIn, UserPlus, Building2, LogOut } from 'lucide-react';

export function TenantHeader({ businessName, businessLogo, primaryColor = '#0284C7', slug }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function doSso() {
      const mainDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      let mainOrigin;
      try {
        mainOrigin = new URL(mainDomain).origin;
      } catch {
        mainOrigin = 'http://localhost:3001';
      }

      try {
        // مرحله 1: آیا روی همین host لاگین هستیم؟
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.user) {
              if (!cancelled) {
                setUser(data.user);
                setLoading(false);
              }
              // workspaces را هم بگیر
              try {
                const wsRes = await fetch('/api/auth/workspaces', { credentials: 'include', cache: 'no-store' });
                const wsJson = await wsRes.json();
                if (!cancelled && wsJson.ok) setWorkspaces(wsJson.dashboards || []);
              } catch {}
              
              // اگر لاگین هستیم، اطمینان بده main هم لاگین دارد (push)
              if (!sessionStorage.getItem('nobatet_sso_pushed_to_main')) {
                try {
                  const tokenRes = await fetch('/api/auth/token', { credentials: 'include', cache: 'no-store' });
                  if (tokenRes.ok) {
                    const tokenData = await tokenRes.json();
                    if (tokenData.ok && tokenData.token) {
                      await fetch(`${mainOrigin}/api/auth/sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        mode: 'cors',
                        body: JSON.stringify({ token: tokenData.token }),
                      });
                      sessionStorage.setItem('nobatet_sso_pushed_to_main', '1');
                    }
                  }
                } catch {}
              }
              return;
            }
          }
        } catch {}

        // مرحله 2: از main بپرس
        setSyncing(true);
        try {
          const fallbackRes = await fetch(`${mainOrigin}/api/auth/me`, {
            credentials: 'include',
            cache: 'no-store',
            mode: 'cors',
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.ok && fallbackData.user) {
              if (!cancelled) setUser(fallbackData.user);
              // token sync
              try {
                const tokenRes = await fetch(`${mainOrigin}/api/auth/token`, {
                  credentials: 'include',
                  cache: 'no-store',
                  mode: 'cors',
                });
                if (tokenRes.ok) {
                  const tokenData = await tokenRes.json();
                  if (tokenData.ok && tokenData.token) {
                    const syncRes = await fetch('/api/auth/sync', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ token: tokenData.token }),
                    });
                    if (syncRes.ok) {
                      // بعد از sync دوباره me را روی همین host چک کن
                      const recheck = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
                      if (recheck.ok) {
                        const reJson = await recheck.json();
                        if (!cancelled && reJson.ok) setUser(reJson.user);
                      }
                    }
                  }
                }
              } catch (e) {
                console.debug('[TenantHeader] SSO sync failed', e?.message);
              }
              // workspaces از main
              try {
                const wsRes = await fetch(`${mainOrigin}/api/auth/workspaces`, {
                  credentials: 'include',
                  cache: 'no-store',
                  mode: 'cors',
                });
                const wsJson = await wsRes.json();
                if (!cancelled && wsJson.ok) setWorkspaces(wsJson.dashboards || []);
              } catch {}
            }
          }
        } catch {}
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSyncing(false);
        }
      }
    }

    doSso();

    // گوش به event که SsoProvider ممکن است بفرستد
    const handler = () => doSso();
    window.addEventListener('nobatet:sso-synced', handler);
    return () => {
      cancelled = true;
      window.removeEventListener('nobatet:sso-synced', handler);
    };
  }, []);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';
  const isLocal = baseDomain.includes('localhost') || baseDomain.startsWith('127.');
  const mainOrigin = process.env.NEXT_PUBLIC_APP_URL || (isLocal ? 'http://localhost:3001' : `https://${baseDomain}`);
  let homeUrl;
  try {
    homeUrl = new URL(mainOrigin).origin;
  } catch {
    homeUrl = isLocal ? 'http://localhost:3001' : `https://${baseDomain}`;
  }

  const dashboardPath = workspaces.length > 1 ? '/choose-workspace' : workspaces[0]?.href || '/me';
  const dashboardHref = `${homeUrl}${dashboardPath}`;

  // ذخیره visited host برای logout گسترده
  useEffect(() => {
    try {
      const key = 'nobatet_visited_hosts';
      const currentOrigin = window.location.origin;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (!list.includes(currentOrigin)) {
        localStorage.setItem(key, JSON.stringify([...list, currentOrigin].slice(-10)));
      }
    } catch {}
  }, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-[60px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* لندینگ خودش: لینک به همین صفحه (/) ولی روی همین subdomain می‌ماند */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <div className="relative size-9 rounded-xl overflow-hidden bg-white/80 border border-white/50 shadow-sm backdrop-blur shrink-0 ring-1 ring-white/30 group-hover:shadow-md transition-all duration-300 group-hover:scale-[1.02]">
              {businessLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={businessLogo} alt={businessName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                  <Building2 className="size-4 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="font-lalezar text-[15px] truncate leading-none tracking-tight" style={{ fontFamily: 'var(--font-lalezar)' }}>
                {businessName}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                قدرت گرفته از نوبتت
                {syncing && <span className="mr-1 text-[9px] text-primary animate-pulse">• همگام‌سازی...</span>}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 rounded-xl bg-white/60 backdrop-blur animate-pulse border border-white/40" />
              <div className="h-8 w-8 rounded-xl bg-white/40 animate-pulse sm:hidden" />
            </div>
          ) : user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white/70 border border-white/40 px-2.5 py-1.5 backdrop-blur shadow-sm">
                <div className="size-6 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-sm">
                  <User className="size-3" />
                </div>
                <span className="text-[12px] font-medium text-foreground max-w-[90px] truncate">{user.firstName || user.phone}</span>
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              </div>
              <a
                href={dashboardHref}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 text-white px-4 text-[12px] font-bold hover:bg-slate-800 cursor-pointer shadow-[0_4px_12px_rgba(15,23,42,0.15)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.2)] transition-all active:scale-[0.98]"
              >
                <LayoutDashboard className="size-3.5" />
                داشبورد
              </a>
            </>
          ) : (
            <>
              <a
                href={`${homeUrl}/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/')}`}
                className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/70 backdrop-blur px-3.5 text-[12px] font-medium hover:bg-white/90 hover:border-white/80 cursor-pointer transition-all shadow-sm hover:shadow"
              >
                <LogIn className="size-3.5" />
                ورود
              </a>
              <a
                href={`${homeUrl}/register`}
                className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-primary text-white px-4 text-[12px] font-bold shadow-[0_4px_12px_rgba(2,132,199,0.2)] hover:bg-secondary hover:shadow-[0_6px_20px_rgba(2,132,199,0.3)] cursor-pointer transition-all active:scale-[0.98]"
              >
                <UserPlus className="size-3.5" />
                ثبت‌نام
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
