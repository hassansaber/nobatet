'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';
import { DonutChart, BarChart, LineChart } from '@/components/ui/Charts';

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
      if (!data.ok) { setError(data.error||'خطا'); return; }
      setUpcoming(data.upcoming||[]);
      setHistory(data.history||[]);
    } catch { setError('ارتباط برقرار نشد'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function cancel(id) {
    if (!confirm('لغو این نوبت؟ ممکن است قوانین لغو اعمال شود')) return;
    const res = await fetch('/api/me/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: id, action: 'cancel' }) });
    const data = await res.json();
    if (!data.ok) alert(data.error||'لغو ناموفق'); else load();
  }

  const list = mode === 'history' ? history : upcoming;
  const totalSpent = [...upcoming, ...history].filter((b)=>['confirmed','completed'].includes(b.status)).reduce((s,b)=>s+(b.totalAmount||0),0);
  const statusChart = [
    { label:'تأیید', value: [...upcoming,...history].filter((b)=>b.status==='confirmed').length, color:'#0284C7' },
    { label:'انجام', value: history.filter((b)=>b.status==='completed').length, color:'#2563eb' },
    { label:'لغو', value: [...upcoming,...history].filter((b)=>b.status==='cancelled').length, color:'#ef4444' },
  ];

  if (mode==='history') {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-black">تاریخچه نوبت‌ها • تحلیل شخصی</h1>
        <div className="grid sm:grid-cols-3 gap-3">
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">کل پرداخت شده</p><p className="text-xl font-black">{formatRial(totalSpent)} ت</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">تعداد نوبت</p><p className="text-xl font-black">{upcoming.length + history.length}</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">نرخ وفاداری</p><p className="text-xl font-black">{history.length ? Math.round((history.filter((b)=>b.status==='completed').length / history.length)*100) : 0}%</p></CardContent></Card>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card><CardHeader><CardTitle className="text-sm">وضعیت نوبت‌ها</CardTitle></CardHeader><CardContent><DonutChart data={statusChart} size={120} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">هزینه ماهانه</CardTitle></CardHeader><CardContent><BarChart data={history.slice(0,6).map((b)=>({label:new Date(b.startsAt).toLocaleDateString('fa-IR',{month:'short'}), value:b.totalAmount}))} /></CardContent></Card>
        </div>

        <div className="space-y-3">
          {list.map((b) => (
            <Card key={b.id}><CardHeader className="pb-2"><CardTitle className="text-base">{b.serviceName||'خدمت'} · {b.businessName}</CardTitle><p className="text-xs text-muted-foreground">{new Date(b.startsAt).toLocaleString('fa-IR',{dateStyle:'full',timeStyle:'short'})}</p></CardHeader><CardContent className="space-y-1 text-sm"><p>وضعیت: <strong>{b.status}</strong> • {formatRial(b.totalAmount)} ت</p></CardContent></Card>
          ))}
          {list.length===0 && !loading && <p className="text-sm text-muted-foreground text-center py-6">تاریخچه‌ای نیست — بعد از اولین رزرو نمودارهای شما کامل می‌شود</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-black">نوبت‌های پیش‌رو + داشبورد شخصی</h1>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="border-teal-200 bg-teal-50/40"><CardContent className="py-4"><p className="text-xs">پیش‌رو</p><p className="text-2xl font-black">{upcoming.length}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs">انجام شده</p><p className="text-2xl font-black">{history.filter((b)=>b.status==='completed').length}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs">کل پرداختی</p><p className="text-xl font-black">{formatRial(totalSpent)} ت</p></CardContent></Card>
      </div>

      {loading && <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {list.length===0 && !loading && (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">نوبت فعالی ندارید — به صفحه کسب‌وکار بروید و اولین نوبت را رزرو کنید</CardContent></Card>
      )}

      <div className="space-y-3">
        {list.map((b) => (
          <Card key={b.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2"><CardTitle className="text-base">{b.serviceName||'خدمت'} · {b.businessName}</CardTitle><p className="text-xs text-muted-foreground">{new Date(b.startsAt).toLocaleString('fa-IR',{dateStyle:'full',timeStyle:'short'})}</p></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>وضعیت: <strong className={b.status==='confirmed'?'text-teal-700':''}>{b.status}</strong> • {formatRial(b.totalAmount)} ت</p>
              {['confirmed','pending_payment'].includes(b.status) && <Button size="sm" variant="danger" onClick={()=>cancel(b.id)}>لغو نوبت</Button>}
              {b.cancellationPolicy && <p className="text-[11px] text-muted-foreground bg-slate-50 border p-2 rounded-lg">قوانین: {b.cancellationPolicy.slice(0,120)}...</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900 text-white border-slate-900">
        <CardContent className="py-4 text-xs leading-6">
          💡 نمودار وفاداری: هرچه بیشتر بیایید امتیاز باشگاه بیشتر می‌شود. از تب “تاریخچه” نمودارهای حرفه‌ای را ببینید.
        </CardContent>
      </Card>
    </div>
  );
}
