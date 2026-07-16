'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const STATUS_LABEL = {
  pending_payment: 'پرداخت',
  confirmed: 'تأیید',
  completed: 'انجام',
  cancelled: 'لغو',
  no_show: 'نیامد',
  expired: 'منقضی',
};

export function StaffBookings({ todayOnly = false }) {
  const [bookings, setBookings] = useState([]);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/staff/bookings';
      if (todayOnly) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        url += `?from=${start.toISOString()}&to=${end.toISOString()}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا');
        return;
      }
      setBookings(data.bookings || []);
      setMember(data.member);
    } catch {
      setError('ارتباط برقرار نشد');
    } finally {
      setLoading(false);
    }
  }, [todayOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(bookingId, action) {
    const res = await fetch('/api/staff/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, action }),
    });
    const data = await res.json();
    if (!data.ok) alert(data.error || 'ناموفق');
    else load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black">
          {todayOnly ? 'تقویم امروز' : 'نوبت‌های من'}
        </h1>
        {member && (
          <p className="text-sm text-muted-foreground mt-1">
            {member.businessName}
            {member.jobTitle ? ` · ${member.jobTitle}` : ''}
          </p>
        )}
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
            نوبتی نیست
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {bookings.map((b) => (
          <Card key={b.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between gap-2">
                <CardTitle className="text-base">
                  {b.serviceName || 'خدمت'}
                </CardTitle>
                <span className="text-[11px] rounded-full border px-2 py-0.5">
                  {STATUS_LABEL[b.status] || b.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(b.startsAt).toLocaleString('fa-IR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                {b.customerName}{' '}
                <span dir="ltr" className="text-muted-foreground text-xs">
                  {b.customerPhone}
                </span>
              </p>
              {b.status === 'confirmed' && (
                <div className="flex flex-wrap gap-2">
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
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
