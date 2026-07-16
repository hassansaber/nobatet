'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';

export function PaymentsManager() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/business/payments');
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا');
        return;
      }
      setPayments(data.payments || []);
    } catch {
      setError('ارتباط برقرار نشد');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function review(paymentId, action) {
    setActing(paymentId + action);
    try {
      const res = await fetch('/api/business/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || 'عملیات ناموفق');
        return;
      }
      load();
    } catch {
      alert('خطای شبکه');
    } finally {
      setActing('');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black">تأیید کارت‌به‌کارت</h1>
        <Button size="sm" variant="secondary" onClick={load}>
          بروزرسانی
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && payments.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            پرداخت در انتظاری نیست.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {payments.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {p.booking?.customerName}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {p.booking?.startsAt
                  ? new Date(p.booking.startsAt).toLocaleString('fa-IR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—'}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p dir="ltr" className="text-left sm:text-right">
                موبایل: {p.booking?.customerPhone}
              </p>
              <p>مبلغ: {formatRial(p.amount)} تومان</p>
              <p>
                ۴ رقم کارت مبدأ:{' '}
                <span className="font-mono font-bold" dir="ltr">
                  {p.sourceCardLast4 || '—'}
                </span>
              </p>
              {p.transferReportedAt && (
                <p className="text-xs text-muted-foreground">
                  اعلام واریز:{' '}
                  {new Date(p.transferReportedAt).toLocaleString('fa-IR')}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  loading={acting === p.id + 'approve'}
                  onClick={() => review(p.id, 'approve')}
                >
                  تأیید و قطعی‌سازی
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={acting === p.id + 'reject'}
                  onClick={() => review(p.id, 'reject')}
                >
                  رد
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
