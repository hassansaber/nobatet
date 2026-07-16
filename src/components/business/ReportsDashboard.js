'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatRial } from '@/lib/utils';

export function ReportsDashboard() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/business/reports?days=${days}`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا');
        return;
      }
      setReport(data.report);
    } catch {
      setError('ارتباط برقرار نشد');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const maxRev = Math.max(
    1,
    ...(report?.dailyRevenue || []).map((d) => d.revenue),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">گزارش‌ها</h1>
          <p className="text-sm text-muted-foreground mt-1">
            درآمد، نرخ لغو، پرکارترین خدمات و کارمندان
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={cn(
                'h-8 rounded-lg px-3 text-xs font-medium border',
                days === d
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-border',
              )}
            >
              {d} روز
            </button>
          ))}
          <a
            href={`/api/business/export?type=bookings&days=${days}`}
            className="inline-flex h-8 items-center rounded-lg border border-border bg-white px-3 text-xs font-medium"
          >
            CSV رزروها
          </a>
          <Button size="sm" variant="secondary" onClick={load}>
            بروزرسانی
          </Button>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">در حال محاسبه...</p>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {report && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'درآمد',
                value: formatRial(report.summary.revenue),
                hint: 'تومان · تأیید/انجام',
              },
              {
                label: 'رزروها',
                value: String(report.summary.totalBookings),
                hint: `${report.summary.confirmed} قطعی`,
              },
              {
                label: 'نرخ لغو',
                value: `${report.summary.cancelRate}٪`,
                hint: `${report.summary.cancelled} لغو`,
              },
              {
                label: 'میانگین فاکتور',
                value: formatRial(report.summary.avgTicket),
                hint: 'تومان',
              },
            ].map((s) => (
              <Card key={s.label}>
                <CardHeader className="pb-0">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-black mt-1">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {s.hint}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>روند درآمد روزانه</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-0.5 sm:gap-1 h-40 overflow-x-auto pb-2">
                {report.dailyRevenue.map((d) => {
                  const h = Math.max(2, Math.round((d.revenue / maxRev) * 100));
                  return (
                    <div
                      key={d.date}
                      className="flex flex-col items-center justify-end min-w-[10px] flex-1 h-full group"
                      title={`${d.label}: ${formatRial(d.revenue)}`}
                    >
                      <div
                        className="w-full max-w-[18px] rounded-t bg-primary/80 group-hover:bg-primary transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                از{' '}
                {new Date(report.from).toLocaleDateString('fa-IR')} تا{' '}
                {new Date(report.to).toLocaleDateString('fa-IR')}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>پرکارترین خدمات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.topServices.length === 0 && (
                  <p className="text-sm text-muted-foreground">داده‌ای نیست</p>
                )}
                {report.topServices.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between text-sm border-b border-border/60 pb-2"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {s.count}× · {formatRial(s.revenue)} ت
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>پرکارترین کارمندان</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.topStaff.length === 0 && (
                  <p className="text-sm text-muted-foreground">داده‌ای نیست</p>
                )}
                {report.topStaff.map((s) => (
                  <div
                    key={s.memberId}
                    className="flex items-center justify-between text-sm border-b border-border/60 pb-2"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {s.count}× · {formatRial(s.revenue)} ت
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              { l: 'انجام‌شده', v: report.summary.completed },
              { l: 'نیامد', v: report.summary.noShow },
              { l: 'در انتظار', v: report.summary.pending },
              { l: 'لغو', v: report.summary.cancelled },
            ].map((x) => (
              <div
                key={x.l}
                className="rounded-xl border border-border bg-white p-3"
              >
                <p className="text-lg font-black">{x.v}</p>
                <p className="text-[11px] text-muted-foreground">{x.l}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
