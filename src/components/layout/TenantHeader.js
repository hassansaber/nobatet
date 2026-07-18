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
        // 1. Try subdomain session first
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.user) {
              if (!cancelled) {
                setUser(data.user);
                setLoading(false);
              }
              // Also fetch workspaces from same origin
              try {
                const wsRes = await fetch('/api/auth/workspaces', { credentials: 'include', cache: 'no-store' });
                const wsJson = await wsRes.json();
                if (!cancelled && wsJson.ok) setWorkspaces(wsJson.dashboards || []);
              } catch {}
              return;
            }
          }
        } catch {}

        // 2. Fallback: try main domain via absolute URL (cross-subdomain SSO)
        try {
          const fallbackRes = await fetch(`${mainDomain}/api/auth/me`, { credentials: 'include', cache: 'no-store', mode: 'cors' });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.ok && fallbackData.user) {
              if (!cancelled) setUser(fallbackData.user);
              
              // Attempt to sync token to subdomain so future requests don't need fallback
              try {
                const tokenRes = await fetch(`${mainDomain}/api/auth/token`, { credentials: 'include', cache: 'no-store', mode: 'cors' });
                if (tokenRes.ok) {
                  const tokenData = await tokenRes.json();
                  if (tokenData.ok && tokenData.token) {
                    // Sync to current subdomain
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

              // Fetch workspaces from main domain as fallback
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
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/70 backdrop-blur-2xl shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <div className="relative size-8 rounded-xl overflow-hidden bg-white border shadow-sm shrink-0 ring-1 ring-black/5 group-hover:shadow-md transition-shadow">
              {businessLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={businessLogo} alt={businessName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: primaryColor }}>
                  <Building2 className="size-4 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="font-black text-sm truncate leading-none">{businessName}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span className="size-1 rounded-full bg-primary animate-pulse" />
                قدرت گرفته از نوبتت
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-24 rounded-xl bg-slate-100 animate-pulse" />
          ) : user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white/60 backdrop-blur border border-white/40 px-3 py-1.5 shadow-sm">
                <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center">
                  <User className="size-3.5" />
                </div>
                <span className="text-xs font-bold text-foreground max-w-[80px] truncate">
                  {user.firstName || user.phone}
                </span>
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <Link href={dashboardHref} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 text-white px-4 text-xs font-black hover:bg-slate-800 cursor-pointer shadow-md transition-all">
                <LayoutDashboard className="size-3.5" />
                داشبورد
              </Link>
            </>
          ) : (
            <>
              <Link href={`${homeUrl}/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/')}`} className="h-9 inline-flex items-center gap-1 rounded-xl border border-white/40 bg-white/60 backdrop-blur px-4 text-xs font-bold hover:bg-white cursor-pointer transition-colors">
                <LogIn className="size-3.5" />
                ورود
              </Link>
              <Link href={`${homeUrl}/register`} className="h-9 inline-flex items-center gap-1 rounded-xl bg-primary text-white px-4 text-xs font-black shadow-md hover:bg-secondary cursor-pointer transition-colors">
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
