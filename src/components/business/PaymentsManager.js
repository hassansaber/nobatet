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
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/business/payments');
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'خطا'); return; }
      setPayments(data.payments || []);
    } catch { setError('ارتباط برقرار نشد'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function review(paymentId, action) {
    setActing(paymentId + action);
    try {
      const res = await fetch('/api/business/payments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId, action }) });
      const data = await res.json();
      if (!data.ok) { alert(data.error || 'عملیات ناموفق'); return; }
      load();
    } catch { alert('خطای شبکه'); } finally { setActing(''); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black">تأیید کارت‌به‌کارت</h1>
        <Button size="sm" variant="secondary" onClick={load}>بروزرسانی</Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && payments.length === 0 && (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">پرداخت در انتظاری نیست. وقتی مشتری کارت‌به‌کارت کند اینجا نمایش داده می‌شود.</CardContent></Card>
      )}

      <div className="space-y-4">
        {payments.map((p) => (
          <Card key={p.id} className="overflow-hidden border-amber-200">
            <CardHeader className="pb-2 bg-amber-50/50">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{p.booking?.customerName} — {formatRial(p.amount)} ت</span>
                <span className="text-[11px] bg-amber-600 text-white px-2 py-0.5 rounded-full">در انتظار تأیید</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{p.booking?.startsAt ? new Date(p.booking.startsAt).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm pt-4">
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 border p-2.5"><p className="text-muted-foreground">موبایل مشتری</p><p className="font-mono font-bold mt-1" dir="ltr">{p.booking?.customerPhone}</p></div>
                <div className="rounded-lg bg-slate-50 border p-2.5"><p className="text-muted-foreground">۴ رقم آخر کارت مبدأ</p><p className="font-mono font-black text-base mt-1" dir="ltr">{p.sourceCardLast4 || '—'}</p></div>
                <div className="rounded-lg bg-slate-50 border p-2.5"><p className="text-muted-foreground">شماره پیگیری / تراکنش</p><p className="font-mono font-bold mt-1" dir="ltr">{p.transferCode || p.gatewayRef || '—'}</p></div>
                <div className="rounded-lg bg-slate-50 border p-2.5"><p className="text-muted-foreground">زمان اعلام واریز</p><p className="font-medium mt-1">{p.transferReportedAt ? new Date(p.transferReportedAt).toLocaleString('fa-IR') : '—'}</p></div>
              </div>

              {p.transferNote && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                  <p className="text-[11px] font-bold text-blue-900">توضیحات تراکنش مشتری:</p>
                  <p className="text-sm text-blue-800 mt-1 leading-7 whitespace-pre-wrap">{p.transferNote}</p>
                </div>
              )}

              {p.receiptImageUrl && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">رسید:</p>
                  <a href={p.receiptImageUrl} target="_blank" className="text-xs text-primary underline">نمایش رسید</a>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button size="sm" loading={acting === p.id + 'approve'} onClick={() => review(p.id, 'approve')} className="flex-1">✓ تأیید و قطعی‌سازی</Button>
                <Button size="sm" variant="danger" loading={acting === p.id + 'reject'} onClick={() => review(p.id, 'reject')} className="flex-1">رد پرداخت</Button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">با تأیید، رزرو قطعی و پیامک تأیید ارسال می‌شود</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
