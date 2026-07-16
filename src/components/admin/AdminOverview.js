'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';

export function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview');
      const j = await res.json();
      if (!j.ok) {
        setError(j.error || 'خطا');
        return;
      }
      setData(j.overview);
    } catch {
      setError('ارتباط برقرار نشد');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;
  }

  const cards = [
    { l: 'بیزنس‌ها', v: data.counts.businesses },
    { l: 'کاربران', v: data.counts.users },
    { l: 'ویزیتورها', v: data.counts.visitors },
    { l: 'رزروها', v: data.counts.bookings },
    { l: 'اشتراک فعال', v: data.counts.activeSubscriptions },
    {
      l: 'درآمد اشتراک',
      v: formatRial(data.subscriptionRevenue),
      hint: 'تومان',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black">نمای کلی پلتفرم</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.l}>
            <CardHeader className="pb-0">
              <p className="text-xs text-muted-foreground">{c.l}</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black mt-1">{c.v}</p>
              {c.hint && (
                <p className="text-[11px] text-muted-foreground">{c.hint}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جدیدترین بیزنس‌ها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recentBusinesses.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between text-sm border-b border-border/60 pb-2"
            >
              <div>
                <p className="font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground">
                  /{b.slug} · {b.ownerName || b.ownerPhone}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {new Date(b.createdAt).toLocaleDateString('fa-IR')}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
