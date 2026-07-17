'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart, DonutChart, LineChart } from '@/components/ui/Charts';
import { formatRial } from '@/lib/utils';

export function BusinessDashboardCharts({ businessId }) {
  const [reports, setReports] = useState(null);
  const [expenses, setExpenses] = useState(null);
  const [sms, setSms] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, eRes, sRes] = await Promise.all([
        fetch('/api/business/reports?days=30'),
        fetch('/api/business/expenses?days=30'),
        fetch('/api/business/sms-usage'),
      ]);
      const r = await rRes.json();
      const e = await eRes.json();
      const s = await sRes.json();
      if (r.ok) setReports(r.report);
      if (e.ok) setExpenses(e);
      if (s.ok) setSms(s.stats);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-sm text-muted-foreground">در حال بارگذاری نمودارها...</p>;

  const revenueData = reports?.dailyRevenue?.slice(-7).map((d) => ({ label: new Date(d.date).toLocaleDateString('fa-IR', { weekday: 'short' }), value: d.revenue })) || [];
  const topServices = reports?.topServices?.slice(0,5).map((s) => ({ label: s.name, value: s.count, color: '#0d9488' })) || [];
  const statusData = reports ? [
    { label: 'تأیید شده', value: reports.summary.confirmed, color: '#0d9488' },
    { label: 'انجام شده', value: reports.summary.completed, color: '#2563eb' },
    { label: 'لغو', value: reports.summary.cancelled, color: '#ef4444' },
    { label: 'در انتظار', value: reports.summary.pending, color: '#f59e0b' },
  ] : [];

  const catData = expenses?.summary?.byCategory ? Object.entries(expenses.summary.byCategory).map(([k,v])=>({ label: { rent:'اجاره', salary:'حقوق', purchase:'خرید', marketing:'تبلیغات', bills:'قبوض', other:'سایر' }[k]||k, value: v, color: { rent:'#7c3aed', salary:'#2563eb', purchase:'#ea580c', marketing:'#0d9488', bills:'#eab308', other:'#64748b' }[k]||'#0d9488' })) : [];

  const smsData = sms?.byPattern ? sms.byPattern.map((p,i)=>({ label: p.pattern, value: p.c, color: ['#0d9488','#2563eb','#7c3aed','#ea580c','#16a34a'][i%5] })) : [];

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">درآمد ۷ روز اخیر (نمودار خطی)</CardTitle></CardHeader>
          <CardContent><LineChart data={revenueData.length ? revenueData : [{label:'ش',value:0},{label:'ی',value:0}]} color="#0d9488" height={120} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">وضعیت رزروها</CardTitle></CardHeader>
          <CardContent>{statusData.length ? <DonutChart data={statusData} size={130} /> : <p className="text-xs text-muted-foreground">داده‌ای نیست</p>}</CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">پرکارترین خدمات</CardTitle></CardHeader>
          <CardContent>{topServices.length ? <BarChart data={topServices} /> : <p className="text-xs text-muted-foreground">داده‌ای نیست</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">هزینه‌ها به تفکیک (۳۰ روز)</CardTitle></CardHeader>
          <CardContent>
            {catData.length ? <DonutChart data={catData} size={110} /> : <p className="text-xs text-muted-foreground">هزینه‌ای ثبت نشده</p>}
            {expenses && <p className="text-[11px] text-muted-foreground mt-2">جمع هزینه: {formatRial(expenses.summary?.total||0)} ت</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">مصرف پیامک (تفکیک پترن)</CardTitle></CardHeader>
          <CardContent>
            {smsData.length ? <BarChart data={smsData} /> : <p className="text-xs text-muted-foreground">هنوز پیامکی ثبت نشده (لاگ از این به بعد شروع می‌شود)</p>}
            {sms && <div className="mt-3 space-y-1 text-[11px]"><p>کل: {sms.total} • این ماه: {sms.thisMonth}</p><p className="text-muted-foreground">محدودیت پلن: بر اساس maxSmsPerMonth</p></div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">سود و زیان (درآمد - هزینه)</CardTitle></CardHeader>
          <CardContent>
            {reports && expenses ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span>درآمد ۳۰ روز</span><span className="font-black text-green-600">{formatRial(reports.summary.revenue)} ت</span></div>
                <div className="flex justify-between text-sm"><span>هزینه ۳۰ روز</span><span className="font-black text-red-600">{formatRial(expenses.summary?.total||0)} ت</span></div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-base font-black"><span>سود خالص</span><span className={reports.summary.revenue - (expenses.summary?.total||0) >=0 ? 'text-green-700' : 'text-red-700'}>{formatRial(reports.summary.revenue - (expenses.summary?.total||0))} ت</span></div>
              </div>
            ) : <p className="text-xs">—</p>}
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white border-0">
          <CardContent className="py-5">
            <h4 className="font-black">QR کد لندینگ شما</h4>
            <div className="mt-3 flex gap-4 items-center">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin.replace('business','demo.business') : 'https://nobatet.com')}`} alt="qr" className="size-[90px] rounded-xl bg-white p-1" />
              <div className="text-xs leading-6">
                <p>چاپ کنید و در مغازه نصب کنید</p>
                <p className="text-white/80">مشتری اسکن → رزرو مستقیم</p>
                <a href="/business/settings" className="mt-2 inline-flex bg-white text-teal-700 px-3 py-1 rounded-lg font-bold text-[11px]">تنظیمات QR در تنظیمات →</a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
