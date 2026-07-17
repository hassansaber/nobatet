'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function HomeWorkspaceCTA() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/workspaces', { credentials: 'include' });
        const json = await res.json();
        if (json.ok && json.total > 0) setData(json);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading || !data || data.total === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 -mt-4 mb-8">
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-teal-900">👋 خوش برگشتی! {data.session?.firstName || ''}</p>
          <p className="text-xs text-teal-800 mt-1">شما {data.total} فضای کاری دارید — از اینجا انتخاب کن و وارد داشبورد شو</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {data.dashboards.slice(0, 4).map((ws) => (
              <span key={ws.key} className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-100 px-2.5 py-1 text-[11px] font-bold text-teal-900">
                <span>{ws.icon}</span> {ws.title}
              </span>
            ))}
            {data.total > 4 && <span className="text-[11px] text-muted-foreground">+{data.total - 4} بیشتر</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/choose-workspace" className="inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-md hover:bg-secondary">
            ⇄ انتخاب فضای کاری
          </Link>
          <Link href={data.dashboards[0].href} className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-bold">
            ورود به {data.dashboards[0].title.slice(0, 12)}
          </Link>
        </div>
      </div>
    </section>
  );
}
