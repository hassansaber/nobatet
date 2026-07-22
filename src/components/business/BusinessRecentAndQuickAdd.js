'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Clock, Check, X, UserPlus, CalendarPlus } from 'lucide-react';

export function BusinessRecentAndQuickAdd({ businessId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuick, setShowQuick] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', startsAt: '', serviceId: '' });
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/business/bookings?businessId=${businessId}&_t=${Date.now()}`);
        const data = await res.json();
        if (data.ok) setBookings(data.bookings?.slice(0, 5) || []);
      } catch {} finally { setLoading(false); }

      try {
        const sRes = await fetch(`/api/business/services?businessId=${businessId}`);
        const sData = await sRes.json();
        if (sData.ok) setServices(sData.services || []);
      } catch {}
    })();
  }, [businessId]);

  async function handleAction(id, action) {
    try {
      const res = await fetch('/api/business/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: id, action }) });
      const data = await res.json();
      if (data.ok) {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: action === 'confirm' ? 'confirmed' : action === 'cancel' ? 'cancelled' : action } : b)));
      }
    } catch {}
  }

  async function handleQuickAdd(e) {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.startsAt) return;
    setSaving(true);
    try {
      const startsAt = new Date(form.startsAt);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
      const res = await fetch('/api/business/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          serviceId: form.serviceId || null,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          totalAmount: 0,
          notes: 'رزرو دستی - حضوری',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setBookings((prev) => [data.booking, ...prev].slice(0, 5));
        setForm({ customerName: '', customerPhone: '', startsAt: '', serviceId: '' });
        setShowQuick(false);
      }
    } catch {} finally { setSaving(false); }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[13px] flex items-center gap-1.5"><Clock className="size-4" /> ۵ رزرو اخیر</CardTitle>
          <Button size="sm" variant="secondary" className="h-7 text-[11px]" onClick={() => window.location.href = '/business/bookings'}>همه</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-[11px] text-muted-foreground">در حال بارگذاری...</p>}
          {!loading && bookings.length === 0 && <p className="text-[11px] text-muted-foreground">رزروی نیست - با Quick Add اولین رزرو دستی را بساز</p>}
          {bookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl border border-border/50 p-2.5 bg-white/60">
              <div className="min-w-0">
                <p className="font-medium text-[12px] truncate">{b.customerName} • {b.customerPhone}</p>
                <p className="text-[11px] text-muted-foreground">{new Date(b.startsAt).toLocaleDateString('fa-IR')} {new Date(b.startsAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} • {b.serviceName || 'خدمت'} • <span className={b.status === 'confirmed' ? 'text-green-600' : b.status === 'pending_payment' ? 'text-amber-600' : 'text-muted-foreground'}>{b.status}</span></p>
              </div>
              <div className="flex gap-1 shrink-0">
                {b.status === 'pending_payment' && <button onClick={() => handleAction(b.id, 'confirm')} className="size-7 rounded-lg bg-green-600 text-white flex items-center justify-center hover:bg-green-700"><Check className="size-3.5" /></button>}
                {b.status !== 'cancelled' && <button onClick={() => handleAction(b.id, 'cancel')} className="size-7 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center hover:bg-red-100"><X className="size-3.5" /></button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[13px] flex items-center gap-1.5"><CalendarPlus className="size-4" /> افزودن سریع رزرو حضوری</CardTitle>
        </CardHeader>
        <CardContent>
          {!showQuick ? (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground leading-6">برای مشتری حضوری یا تلفنی که آنلاین رزرو نکرده - بدون پرداخت، مستقیم تأیید می‌شود.</p>
              <Button size="sm" className="w-full" onClick={() => setShowQuick(true)}><UserPlus className="size-4" /> افزودن رزرو دستی</Button>
            </div>
          ) : (
            <form onSubmit={handleQuickAdd} className="space-y-3">
              <Input label="نام مشتری *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
              <Input label="موبایل *" dir="ltr" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} required />
              <div>
                <label className="text-[11px] font-medium">تاریخ و ساعت *</label>
                <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="w-full mt-1 rounded-xl border p-2.5 text-[13px]" required />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowQuick(false)}>انصراف</Button>
                <Button type="submit" loading={saving} className="flex-1">ثبت حضوری</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
