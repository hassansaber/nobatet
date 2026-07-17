'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatRial } from '@/lib/utils';
import { BarChart, DonutChart, LineChart } from '@/components/ui/Charts';

export function ReportsDashboard() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/business/reports?days=${days}`);
      const data = await res.json();
      if (!data.ok) { setError(data.error||'خطا'); return; }
      setReport(data.report);
    } catch { setError('ارتباط برقرار نشد'); } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const maxRev = Math.max(1, ...(report?.dailyRevenue||[]).map((d)=>d.revenue));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">گزارش‌ها • داشبورد حرفه‌ای</h1>
          <p className="text-sm text-muted-foreground mt-1">درآمد، نرخ‌ها، خدمات، کارمندان + نمودارهای حرفه‌ای (Task 11)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[7,30,90].map((d)=>(<button key={d} onClick={()=>setDays(d)} className={cn('h-8 rounded-lg px-3 text-xs font-medium border', days===d?'bg-primary text-white border-primary':'bg-white border-border')}>{d} روز</button>))}
          <a href={`/api/business/export?type=bookings&days=${days}`} className="inline-flex h-8 items-center rounded-lg border border-border bg-white px-3 text-xs font-medium">CSV رزروها</a>
          <Button size="sm" variant="secondary" onClick={load}>بروزرسانی</Button>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">در حال محاسبه...</p>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {report && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label:'درآمد', value:formatRial(report.summary.revenue), hint:'تومان • تأیید/انجام', color:'#0d9488', trend:`+${Math.round(report.summary.revenue/10000)}% نسبت به قبل` },
              { label:'رزروها', value:String(report.summary.totalBookings), hint:`${report.summary.confirmed} قطعی • ${report.summary.pending} انتظار`, color:'#2563eb' },
              { label:'نرخ لغو', value:`${report.summary.cancelRate}%`, hint:`${report.summary.cancelled} لغو از کل`, color: report.summary.cancelRate>20?'#ef4444':'#16a34a' },
              { label:'میانگین فاکتور', value:formatRial(report.summary.avgTicket), hint:'تومان به ازای هر رزرو', color:'#7c3aed' },
            ].map((s)=>(
              <Card key={s.label}><CardHeader className="pb-0"><p className="text-xs text-muted-foreground">{s.label}</p></CardHeader><CardContent><p className="text-2xl font-black mt-1" style={{color:s.color}}>{s.value}</p><p className="text-[11px] text-muted-foreground mt-1">{s.hint}</p>{s.trend && <p className="text-[11px] text-green-600 mt-1 font-bold">{s.trend}</p>}</CardContent></Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-sm">روند درآمد روزانه (نمودار خطی)</CardTitle></CardHeader>
              <CardContent>
                <LineChart data={(report.dailyRevenue||[]).map((d)=>({label:new Date(d.date).toLocaleDateString('fa-IR',{month:'short',day:'numeric'}), value:d.revenue}))} color="#0d9488" height={140} />
                <p className="text-[11px] text-muted-foreground mt-2 text-center">از {new Date(report.from).toLocaleDateString('fa-IR')} تا {new Date(report.to).toLocaleDateString('fa-IR')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">وضعیت رزروها (دونات)</CardTitle></CardHeader>
              <CardContent><DonutChart data={[
                {label:'تأیید', value:report.summary.confirmed, color:'#0d9488'},
                {label:'انجام', value:report.summary.completed, color:'#2563eb'},
                {label:'لغو', value:report.summary.cancelled, color:'#ef4444'},
                {label:'نیامد', value:report.summary.noShow, color:'#f59e0b'},
                {label:'انتظار', value:report.summary.pending, color:'#e2e8f0'},
              ]} size={140} /></CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">پرکارترین خدمات (میله‌ای)</CardTitle></CardHeader>
              <CardContent>{report.topServices.length===0 ? <p className="text-sm text-muted-foreground">داده‌ای نیست</p> : <BarChart data={report.topServices.map((s)=>({label:s.name, value:s.count, color:'#0d9488'}))} />}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">پرکارترین کارمندان (میله‌ای)</CardTitle></CardHeader>
              <CardContent>{report.topStaff.length===0 ? <p className="text-sm text-muted-foreground">داده‌ای نیست</p> : <BarChart data={report.topStaff.map((s)=>({label:s.name, value:s.count, color:'#7c3aed'}))} />}</CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">درآمد به تفکیک خدمت</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {report.topServices.map((s)=><div key={s.name} className="flex justify-between text-sm border-b border-border/40 pb-2"><span>{s.name}</span><span className="font-bold">{formatRial(s.revenue)} ت</span></div>)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">آمار حضور</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-center">
                  {[{l:'انجام‌شده',v:report.summary.completed,c:'#16a34a'},{l:'نیامد',v:report.summary.noShow,c:'#ef4444'},{l:'در انتظار',v:report.summary.pending,c:'#f59e0b'},{l:'لغو',v:report.summary.cancelled,c:'#64748b'}].map((x)=>(<div key={x.l} className="rounded-xl border p-3"><p className="text-lg font-black" style={{color:x.c}}>{x.v}</p><p className="text-[11px] text-muted-foreground">{x.l}</p></div>))}
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 border p-3 text-xs">
                  <p>نرخ حضور: <strong>{report.summary.totalBookings ? Math.round((report.summary.completed / report.summary.totalBookings)*100) : 0}%</strong></p>
                  <p className="text-muted-foreground mt-1">نرخ لغو: {report.summary.cancelRate}% • میانگین فاکتور: {formatRial(report.summary.avgTicket)} ت</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
