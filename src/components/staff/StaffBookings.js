'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart, DonutChart, LineChart } from '@/components/ui/Charts';

const STATUS_LABEL = { pending_payment: 'پرداخت', confirmed: 'تأیید', completed: 'انجام', cancelled: 'لغو', no_show: 'نیامد', expired: 'منقضی' };

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
        const start = new Date(); start.setHours(0,0,0,0);
        const end = new Date(start); end.setDate(end.getDate()+1);
        url += `?from=${start.toISOString()}&to=${end.toISOString()}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) { setError(data.error||'خطا'); return; }
      setBookings(data.bookings||[]);
      setMember(data.member);
    } catch { setError('ارتباط برقرار نشد'); } finally { setLoading(false); }
  }, [todayOnly]);

  useEffect(() => { load(); }, [load]);

  async function act(bookingId, action) {
    const res = await fetch('/api/staff/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId, action }) });
    const data = await res.json();
    if (!data.ok) alert(data.error||'ناموفق'); else load();
  }

  const byStatus = [
    { label: 'تأیید', value: bookings.filter((b)=>b.status==='confirmed').length, color:'#0d9488' },
    { label: 'انجام', value: bookings.filter((b)=>b.status==='completed').length, color:'#2563eb' },
    { label: 'نیامد', value: bookings.filter((b)=>b.status==='no_show').length, color:'#ef4444' },
    { label: 'لغو', value: bookings.filter((b)=>b.status==='cancelled').length, color:'#e2e8f0' },
  ];
  const daily = bookings.slice(0,7).map((b,i)=>({label:new Date(b.startsAt).toLocaleDateString('fa-IR',{weekday:'short'}), value:1}));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black">{todayOnly ? 'تقویم امروز • داشبورد کارمند' : 'نوبت‌های من • تحلیل عملکرد'}</h1>
        {member && <p className="text-sm text-muted-foreground mt-1">{member.businessName}{member.jobTitle ? ` · ${member.jobTitle}` : ''} • امتیاز عملکرد حرفه‌ای</p>}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="border-teal-200 bg-teal-50/30"><CardContent className="py-4"><p className="text-xs text-muted-foreground">امروز</p><p className="text-2xl font-black">{bookings.filter((b)=> new Date(b.startsAt).toDateString()===new Date().toDateString()).length}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">انجام شده</p><p className="text-2xl font-black text-blue-600">{bookings.filter((b)=>b.status==='completed').length}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">نرخ حضور</p><p className="text-2xl font-black">{bookings.length? Math.round((bookings.filter((b)=>b.status==='completed').length/ Math.max(1, bookings.filter((b)=>['completed','no_show'].includes(b.status)).length))*100):0}%</p></CardContent></Card>
      </div>

      {bookings.length>0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card><CardHeader><CardTitle className="text-sm">وضعیت نوبت‌ها</CardTitle></CardHeader><CardContent><DonutChart data={byStatus} size={120} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">روند ۷ نوبت اخیر</CardTitle></CardHeader><CardContent><LineChart data={daily.length?daily:[{label:'-',value:0}]} color="#0d9488" /></CardContent></Card>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {!loading && bookings.length===0 && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">نوبتی نیست — وقتی مشتری رزرو کند اینجا نمایش می‌دهیم + نمودار عملکرد ظاهر می‌شود</CardContent></Card>}

      <div className="space-y-3">
        {bookings.map((b) => (
          <Card key={b.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2"><div className="flex justify-between gap-2"><CardTitle className="text-base">{b.serviceName||'خدمت'}</CardTitle><span className="text-[11px] rounded-full border px-2 py-0.5 bg-slate-50">{STATUS_LABEL[b.status]||b.status}</span></div><p className="text-xs text-muted-foreground">{new Date(b.startsAt).toLocaleString('fa-IR',{dateStyle:'medium',timeStyle:'short'})}</p></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{b.customerName} <span dir="ltr" className="text-muted-foreground text-xs">{b.customerPhone}</span></p>
              {b.notes && <p className="text-xs bg-amber-50 border border-amber-200 p-2 rounded-lg">📝 {b.notes}</p>}
              {b.status==='confirmed' && (<div className="flex flex-wrap gap-2"><Button size="sm" onClick={()=>act(b.id,'complete')}>✓ انجام شد</Button><Button size="sm" variant="secondary" onClick={()=>act(b.id,'no_show')}>نیامد</Button></div>)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
