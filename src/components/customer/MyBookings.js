'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';

export function MyBookings({ mode = 'upcoming' }) {
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me/bookings');
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا');
        return;
      }
      setUpcoming(data.upcoming || []);
      setHistory(data.history || []);
    } catch {
      setError('ارتباط برقرار نشد');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(id) {
    if (!confirm('لغو این نوبت؟')) return;
    const res = await fetch('/api/me/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: id, action: 'cancel' }),
    });
    const data = await res.json();
    if (!data.ok) alert(data.error || 'لغو ناموفق');
    else load();
  }

  const list = mode === 'history' ? history : upcoming;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">
        {mode === 'history' ? 'تاریخچه' : 'نوبت‌های پیش‌رو'}
      </h1>

      {loading && (
        <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {!loading && list.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground space-y-3">
            <p>موردی نیست</p>
            {mode === 'upcoming' && (
              <a href={process.env.NEXT_PUBLIC_APP_URL || '/'}>
                <Button size="sm">بازگشت به نوبتت</Button>
              </a>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {list.map((b) => (
          <Card key={b.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {b.serviceName || 'خدمت'} · {b.businessName}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {new Date(b.startsAt).toLocaleString('fa-IR', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                وضعیت: <strong>{b.status}</strong> ·{' '}
                {formatRial(b.totalAmount)} ت
              </p>
              {mode === 'upcoming' &&
                ['confirmed', 'pending_payment'].includes(b.status) && (
                  <Button size="sm" variant="danger" onClick={() => cancel(b.id)}>
                    لغو نوبت
                  </Button>
                )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
