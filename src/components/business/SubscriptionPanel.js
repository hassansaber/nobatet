'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatRial } from '@/lib/utils';

export function SubscriptionPanel() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business/subscription');
      const j = await res.json();
      if (!j.ok) {
        setError(j.error || 'خطا');
        return;
      }
      setData(j);
    } catch {
      setError('ارتباط برقرار نشد');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upgrade(planId) {
    setBusy(planId);
    try {
      const res = await fetch('/api/business/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle: 'monthly' }),
      });
      const j = await res.json();
      if (!j.ok) {
        alert(j.error || 'ناموفق');
        return;
      }
      if (j.redirectUrl) router.push(j.redirectUrl);
    } finally {
      setBusy('');
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const sub = data.subscription;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">اشتراک SaaS</h1>
        <p className="text-sm text-muted-foreground mt-1">
          پلن فعلی، ارتقا و تاریخچه پرداخت
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>وضعیت فعلی</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {sub ? (
            <>
              <p>
                پلن: <strong>{sub.plan?.name || '—'}</strong> ({sub.status})
              </p>
              {sub.endsAt && (
                <p className="text-muted-foreground">
                  پایان:{' '}
                  {new Date(sub.endsAt).toLocaleDateString('fa-IR')}
                </p>
              )}
              {sub.trialEndsAt && sub.status === 'trial' && (
                <p className="text-amber-700 text-xs">
                  آزمایشی تا{' '}
                  {new Date(sub.trialEndsAt).toLocaleDateString('fa-IR')}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">اشتراکی ثبت نشده</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {data.plans.map((p) => {
          const current = sub?.planId === p.id;
          return (
            <Card
              key={p.id}
              className={cn(current && 'ring-2 ring-primary/40 border-primary')}
            >
              <CardHeader>
                <CardTitle className="text-base">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-black">
                  {p.priceMonthly === 0
                    ? 'رایگان'
                    : `${formatRial(p.priceMonthly)}`}
                  {p.priceMonthly > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {' '}
                      / ماه
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.maxStaff} کارمند · {p.maxServices} خدمت
                </p>
                <p className="text-xs text-muted-foreground min-h-10">
                  {p.description}
                </p>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={current || p.priceMonthly === 0}
                  loading={busy === p.id}
                  onClick={() => upgrade(p.id)}
                >
                  {current
                    ? 'پلن فعلی'
                    : p.priceMonthly === 0
                      ? 'پایه'
                      : 'ارتقا / تمدید'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تاریخچه فاکتورها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.invoices.length === 0 && (
            <p className="text-sm text-muted-foreground">فاکتوری نیست</p>
          )}
          {data.invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex justify-between text-sm border-b border-border/60 pb-2"
            >
              <div>
                <p className="font-medium">{formatRial(inv.amount)} ت</p>
                <p className="text-xs text-muted-foreground">
                  {inv.status} ·{' '}
                  {new Date(inv.createdAt).toLocaleDateString('fa-IR')}
                </p>
              </div>
              <span className="text-xs">{inv.note}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
