'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatRial } from '@/lib/utils';

const STATUS_LABEL = {
  pending_payment: 'در انتظار پرداخت',
  confirmed: 'تأیید شده',
  completed: 'انجام‌شده',
  cancelled: 'لغو شده',
  no_show: 'نیامد',
  expired: 'منقضی',
};

const STATUS_COLOR = {
  pending_payment: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-teal-50 text-teal-800 border-teal-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  no_show: 'bg-orange-50 text-orange-800 border-orange-200',
  expired: 'bg-slate-50 text-slate-500 border-slate-200',
};

export function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = filter ? `?status=${filter}` : '';
      const res = await fetch(`/api/business/bookings${q}`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا');
        return;
      }
      setBookings(data.bookings || []);
    } catch {
      setError('ارتباط برقرار نشد');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(bookingId, action) {
    try {
      const res = await fetch('/api/business/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || 'عملیات ناموفق');
        return;
      }
      load();
    } catch {
      alert('خطای شبکه');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black">رزروها</h1>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: '', label: 'همه' },
            { id: 'confirmed', label: 'تأیید' },
            { id: 'pending_payment', label: 'پرداخت' },
            { id: 'cancelled', label: 'لغو' },
          ].map((f) => (
            <button
              key={f.id || 'all'}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                'h-8 rounded-lg px-3 text-xs font-medium border',
                filter === f.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-border text-muted-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
          <Button size="sm" variant="secondary" onClick={load}>
            بروزرسانی
          </Button>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            رزروی ثبت نشده است.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {bookings.map((b) => (
          <Card key={b.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    {b.serviceName || 'خدمت'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(b.startsAt).toLocaleString('fa-IR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-[11px] font-medium border rounded-full px-2 py-0.5',
                    STATUS_COLOR[b.status] || STATUS_COLOR.expired,
                  )}
                >
                  {STATUS_LABEL[b.status] || b.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">مشتری: </span>
                  {b.customerName}
                </p>
                <p dir="ltr" className="text-left sm:text-right">
                  <span className="text-muted-foreground">موبایل: </span>
                  {b.customerPhone}
                </p>
                <p>
                  <span className="text-muted-foreground">مبلغ: </span>
                  {formatRial(b.totalAmount)} تومان
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {b.status === 'pending_payment' && (
                  <Button size="sm" onClick={() => act(b.id, 'confirm')}>
                    تأیید دستی
                  </Button>
                )}
                {b.status === 'confirmed' && (
                  <>
                    <Button size="sm" onClick={() => act(b.id, 'complete')}>
                      انجام شد
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => act(b.id, 'no_show')}
                    >
                      نیامد
                    </Button>
                  </>
                )}
                {['pending_payment', 'confirmed'].includes(b.status) && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => act(b.id, 'cancel')}
                  >
                    لغو
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
