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

  if (loading) return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/40 backdrop-blur animate-pulse border border-white/20" />
        ))}
      </div>
      <div className="grid lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8 h-[140px] rounded-xl bg-white/40 animate-pulse border" />
        <div className="lg:col-span-4 h-[140px] rounded-xl bg-white/40 animate-pulse border" />
      </div>
    </div>
  );

  const revenueData = reports?.dailyRevenue?.slice(-7).map((d) => ({ label: new Date(d.date).toLocaleDateString('fa-IR', { weekday: 'short' }), value: d.revenue })) || [];
  const topServices = reports?.topServices?.slice(0,5).map((s) => ({ label: s.name, value: s.count, color: '#0284C7' })) || [];
  const statusData = reports ? [
    { label: 'تأیید', value: reports.summary.confirmed, color: '#0284C7' },
    { label: 'انجام', value: reports.summary.completed, color: '#0EA5E9' },
    { label: 'لغو', value: reports.summary.cancelled, color: '#DC2626' },
    { label: 'انتظار', value: reports.summary.pending, color: '#D97706' },
  ] : [];

  const catData = expenses?.summary?.byCategory ? Object.entries(expenses.summary.byCategory).map(([k,v])=>({ label: { rent:'اجاره', salary:'حقوق', purchase:'خرید', marketing:'تبلیغات', bills:'قبوض', other:'سایر' }[k]||k, value: v, color: { rent:'#7c3aed', salary:'#0284C7', purchase:'#D97706', marketing:'#059669', bills:'#EAB308', other:'#64748b' }[k]||'#0284C7' })) : [];
  const smsData = sms?.byPattern ? sms.byPattern.map((p,i)=>({ label: p.pattern, value: p.c, color: ['#0284C7','#0EA5E9','#059669','#D97706','#1E40AF'][i%5] })) : [];

  const kpis = [
    { label: 'درآمد ۳۰ روز', value: formatRial(reports?.summary.revenue || 0), sub: `${reports?.summary.totalBookings || 0} رزرو`, color: '#059669' },
    { label: 'نرخ لغو', value: `${reports?.summary.cancelRate || 0}%`, sub: `${reports?.summary.cancelled || 0} لغو`, color: reports?.summary.cancelRate > 20 ? '#DC2626' : '#059669' },
    { label: 'میانگین فاکتور', value: formatRial(reports?.summary.avgTicket || 0), sub: 'هر رزرو', color: '#0284C7' },
    { label: 'هزینه‌ها', value: formatRial(expenses?.summary?.total || 0), sub: `${expenses?.summary?.count || 0} تراکنش`, color: '#D97706' },
    { label: 'سود خالص', value: formatRial((reports?.summary.revenue || 0) - (expenses?.summary?.total || 0)), sub: 'درآمد - هزینه', color: ((reports?.summary.revenue || 0) - (expenses?.summary?.total || 0)) >=0 ? '#059669' : '#DC2626' },
    { label: 'پیامک', value: `${sms?.thisMonth || 0}/${sms?.total || 0}`, sub: 'این ماه / کل', color: '#0EA5E9' },
  ];

  return (
    <div className="space-y-3">
      {/* KPI Grid - Data-Dense, minimal padding */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-white/70 backdrop-blur px-3 py-2.5 hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer group">
            <p className="text-[10px] text-muted-foreground font-medium">{kpi.label}</p>
            <p className="text-[13px] font-black mt-1 tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-3">
        {/* Revenue - takes 8 cols */}
        <Card className="lg:col-span-8 rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs flex items-center justify-between">درآمد ۷ روز اخیر <span className="text-[10px] font-normal text-muted-foreground">hover برای جزئیات</span></CardTitle></CardHeader>
          <CardContent className="px-4 pb-3"><LineChart data={revenueData.length ? revenueData : [{label:'ش',value:0},{label:'ی',value:0}]} color="#0284C7" height={90} /></CardContent>
        </Card>
        <Card className="lg:col-span-4 rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs">وضعیت رزروها</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">{statusData.length ? <DonutChart data={statusData} size={110} /> : <p className="text-xs text-muted-foreground">داده‌ای نیست</p>}</CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-12 gap-3">
        <Card className="lg:col-span-4 rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs">پرکارترین خدمات</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">{topServices.length ? <BarChart data={topServices} /> : <p className="text-xs text-muted-foreground">داده‌ای نیست</p>}</CardContent>
        </Card>
        <Card className="lg:col-span-4 rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs">هزینه‌ها (۳۰ روز)</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            {catData.length ? <DonutChart data={catData} size={90} /> : <p className="text-xs text-muted-foreground">هزینه‌ای ثبت نشده</p>}
            {expenses && <p className="text-[10px] text-muted-foreground mt-2 tabular-nums">جمع: {formatRial(expenses.summary?.total||0)} ت</p>}
          </CardContent>
        </Card>
        <Card className="lg:col-span-4 rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs">مصرف پیامک</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            {smsData.length ? <BarChart data={smsData} /> : <p className="text-xs text-muted-foreground">لاگ از این به بعد</p>}
            {sms && <div className="mt-2 text-[10px] tabular-nums">کل: {sms.total} • ماه: {sms.thisMonth}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs">سود و زیان</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {reports && expenses ? (
              <>
                <div className="flex justify-between text-[11px]"><span>درآمد</span><span className="font-black tabular-nums text-green-600">{formatRial(reports.summary.revenue)}</span></div>
                <div className="flex justify-between text-[11px]"><span>هزینه</span><span className="font-black tabular-nums text-red-600">{formatRial(expenses.summary?.total||0)}</span></div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-xs font-black"><span>خالص</span><span className={reports.summary.revenue - (expenses.summary?.total||0) >=0 ? 'text-green-700' : 'text-red-700'} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatRial(reports.summary.revenue - (expenses.summary?.total||0))}</span></div>
              </>
            ) : <p className="text-xs">—</p>}
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-slate-900 text-white border-slate-900 lg:col-span-2">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black">QR لندینگ شما</p>
              <p className="text-[11px] text-slate-400 mt-1">چاپ کنید، مشتری اسکن → رزرو مستقیم</p>
            </div>
            <div className="flex items-center gap-3">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin.replace('business','demo.business') : 'https://nobatet.com')}`} alt="qr" className="size-14 rounded-lg bg-white p-1" />
              <a href="/business/settings" className="text-[10px] bg-white text-slate-900 px-2.5 py-1 rounded-full font-bold">تنظیمات →</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
