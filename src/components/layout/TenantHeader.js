'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, LayoutDashboard, LogIn, UserPlus, Building2 } from 'lucide-react';

export function TenantHeader({ businessName, businessLogo, primaryColor = '#0284C7', slug }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mainDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      try {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.user) {
              if (!cancelled) {
                setUser(data.user);
                setLoading(false);
              }
              try {
                const wsRes = await fetch('/api/auth/workspaces', { credentials: 'include', cache: 'no-store' });
                const wsJson = await wsRes.json();
                if (!cancelled && wsJson.ok) setWorkspaces(wsJson.dashboards || []);
              } catch {}
              return;
            }
          }
        } catch {}

        try {
          const fallbackRes = await fetch(`${mainDomain}/api/auth/me`, { credentials: 'include', cache: 'no-store', mode: 'cors' });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.ok && fallbackData.user) {
              if (!cancelled) setUser(fallbackData.user);
              try {
                const tokenRes = await fetch(`${mainDomain}/api/auth/token`, { credentials: 'include', cache: 'no-store', mode: 'cors' });
                if (tokenRes.ok) {
                  const tokenData = await tokenRes.json();
                  if (tokenData.ok && tokenData.token) {
                    await fetch('/api/auth/sync', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ token: tokenData.token }),
                    });
                  }
                }
              } catch (e) {
                console.warn('[TenantHeader] SSO sync failed', e?.message);
              }
              try {
                const wsRes = await fetch(`${mainDomain}/api/auth/workspaces`, { credentials: 'include', cache: 'no-store', mode: 'cors' });
                const wsJson = await wsRes.json();
                if (!cancelled && wsJson.ok) setWorkspaces(wsJson.dashboards || []);
              } catch {}
            }
          }
        } catch {}
      } catch {} finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';
  const isLocal = baseDomain.includes('localhost');
  const homeUrl = isLocal ? 'http://localhost:3001' : `https://${baseDomain}`;
  const dashboardHref = workspaces.length > 1 ? '/choose-workspace' : (workspaces[0]?.href || '/me');

  return (
    <header className="sticky top-0 z-40 glass-header">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-[56px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <div className="relative size-8 rounded-xl overflow-hidden bg-white/70 border border-white/40 shadow-sm backdrop-blur shrink-0 ring-1 ring-white/30 group-hover:shadow-md transition-shadow">
              {businessLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={businessLogo} alt={businessName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm" style={{ backgroundColor: primaryColor }}>
                  <Building2 className="size-4 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="font-lalezar text-[14px] truncate leading-none" style={{ fontFamily: 'var(--font-lalezar)' }}>{businessName}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <span className="size-1 rounded-full bg-primary animate-pulse" />
                قدرت گرفته از نوبتت
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-20 rounded-xl bg-white/40 backdrop-blur animate-pulse" />
          ) : user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-xl glass px-2.5 py-1.5">
                <div className="size-5 rounded-full bg-primary text-white flex items-center justify-center">
                  <User className="size-3" />
                </div>
                <span className="text-[12px] font-medium text-foreground max-w-[80px] truncate">{user.firstName || user.phone}</span>
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <Link href={dashboardHref} className="inline-flex h-8 items-center gap-1 rounded-xl bg-slate-900 text-white px-3.5 text-[12px] font-medium hover:bg-slate-800 cursor-pointer shadow-md transition-all">
                <LayoutDashboard className="size-3.5" />
                داشبورد
              </Link>
            </>
          ) : (
            <>
              <Link href={`${homeUrl}/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/')}`} className="h-8 inline-flex items-center gap-1 rounded-xl border border-white/40 bg-white/50 backdrop-blur px-3 text-[12px] font-medium hover:bg-white/70 cursor-pointer transition-colors">
                <LogIn className="size-3.5" />
                ورود
              </Link>
              <Link href={`${homeUrl}/register`} className="h-8 inline-flex items-center gap-1 rounded-xl bg-primary text-white px-3.5 text-[12px] font-medium shadow-md hover:bg-secondary cursor-pointer transition-colors">
                <UserPlus className="size-3.5" />
                ثبت‌نام
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
