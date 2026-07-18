'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function TenantHeader({ businessName, businessLogo, primaryColor = '#0284C7', slug }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try subdomain session first
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && data.ok && data.user) {
          setUser(data.user);
        } else {
          // Fallback: try main domain via absolute URL (for cross-subdomain SSO)
          // This handles case where cookie is on main domain but not yet on subdomain
          try {
            const mainDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
            const fallbackRes = await fetch(`${mainDomain}/api/auth/me`, { credentials: 'include', cache: 'no-store', mode: 'cors' });
            const fallbackData = await fallbackRes.json();
            if (!cancelled && fallbackData.ok && fallbackData.user) {
              setUser(fallbackData.user);
            }
          } catch {}
        }

        // Fetch workspaces for dashboard button - try subdomain first, then main domain
        try {
          let wsData = null;
          const wsRes = await fetch('/api/auth/workspaces', { credentials: 'include', cache: 'no-store' });
          const wsJson = await wsRes.json();
          if (wsJson.ok) {
            wsData = wsJson;
          } else {
            // Fallback to main domain
            const mainDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
            const fallbackRes = await fetch(`${mainDomain}/api/auth/workspaces`, { credentials: 'include', cache: 'no-store', mode: 'cors' });
            const fallbackJson = await fallbackRes.json();
            if (fallbackJson.ok) wsData = fallbackJson;
          }
          if (!cancelled && wsData?.ok) {
            setWorkspaces(wsData.dashboards || []);
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
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="relative size-8 rounded-xl overflow-hidden bg-white border shadow-sm shrink-0">
              {businessLogo ? (
                <img src={businessLogo} alt={businessName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: primaryColor }}>
                  {businessName?.[0] || 'ن'}
                </div>
              )}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="font-black text-sm truncate leading-none">{businessName}</p>
              <p className="text-[11px] text-muted-foreground">قدرت گرفته از نوبتت</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/" className="hidden sm:inline-flex h-9 items-center rounded-xl border border-border bg-white/80 px-3 text-xs font-bold hover:bg-white cursor-pointer backdrop-blur">
            خانه نوبتت
          </Link>

          {loading ? (
            <div className="h-9 w-24 rounded-xl bg-slate-100 animate-pulse" />
          ) : user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 px-3 py-1.5">
                <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black">
                  {(user.firstName?.[0] || user.phone?.slice(-2) || 'ک')[0]}
                </div>
                <span className="text-xs font-bold text-teal-900 max-w-[80px] truncate">
                  {user.firstName || user.phone}
                </span>
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <Link href={dashboardHref} className="inline-flex h-9 items-center rounded-xl bg-slate-900 text-white px-4 text-xs font-black hover:bg-slate-800 cursor-pointer">
                داشبورد
              </Link>
            </>
          ) : (
            <>
              <Link href={`${homeUrl}/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/')}`} className="h-9 inline-flex items-center rounded-xl border border-border bg-white px-4 text-xs font-bold hover:bg-slate-50 cursor-pointer">
                ورود
              </Link>
              <Link href={`${homeUrl}/register`} className="h-9 inline-flex items-center rounded-xl bg-primary text-white px-4 text-xs font-black shadow-md hover:bg-secondary cursor-pointer">
                ثبت‌نام
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
