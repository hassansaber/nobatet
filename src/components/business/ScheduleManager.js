'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { OFFICIAL_HOLIDAYS, getUpcomingHolidays, jalaliToTimeOffRange } from '@/lib/iranianHolidays';

const DAYS = [
  { id: 0, label: 'شنبه' },
  { id: 1, label: 'یکشنبه' },
  { id: 2, label: 'دوشنبه' },
  { id: 3, label: 'سه‌شنبه' },
  { id: 4, label: 'چهارشنبه' },
  { id: 5, label: 'پنج‌شنبه' },
  { id: 6, label: 'جمعه' },
];

function defaultWeek() {
  return DAYS.map((d) => ({
    dayOfWeek: d.id,
    startTime: '09:00',
    endTime: '18:00',
    isOff: d.id === 6,
  }));
}

export function ScheduleManager() {
  const [hours, setHours] = useState(defaultWeek());
  const [timeOffs, setTimeOffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [offForm, setOffForm] = useState({ startAt: '', endAt: '', reason: '' });
  const [holidayFilter, setHolidayFilter] = useState('upcoming'); // upcoming, 1404, 1405, all

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, tRes] = await Promise.all([fetch('/api/business/hours'), fetch('/api/business/time-offs')]);
      const hData = await hRes.json();
      const tData = await tRes.json();
      if (hData.ok && hData.hours?.length) {
        const map = new Map(hData.hours.map((h) => [h.dayOfWeek, h]));
        setHours(
          DAYS.map((d) => {
            const h = map.get(d.id);
            return h ? { dayOfWeek: d.id, startTime: h.startTime, endTime: h.endTime, isOff: h.isOff } : { dayOfWeek: d.id, startTime: '09:00', endTime: '18:00', isOff: true };
          }),
        );
      }
      if (tData.ok) setTimeOffs(tData.timeOffs || []);
    } catch {
      setError('بارگذاری ناموفق');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateDay(dayOfWeek, patch) {
    setHours((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)));
  }

  async function saveHours() {
    setSaving(true); setError(''); setInfo('');
    try {
      const res = await fetch('/api/business/hours', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hours }) });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ذخیره ناموفق'); return; }
      setInfo('ساعات کاری ذخیره شد');
    } catch { setError('خطای شبکه'); } finally { setSaving(false); }
  }

  async function addTimeOff(e) {
    e?.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/business/time-offs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAt: new Date(offForm.startAt).toISOString(),
          endAt: new Date(offForm.endAt).toISOString(),
          reason: offForm.reason || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت مرخصی ناموفق'); return; }
      setOffForm({ startAt: '', endAt: '', reason: '' });
      load();
    } catch { setError('خطای شبکه'); }
  }

  async function addHolidayAsTimeOff(holiday) {
    try {
      const range = jalaliToTimeOffRange(holiday.jalali);
      // اگر تاریخ خیلی قدیمی است (گذشته)، از تاریخ امروز شمسی استفاده نکن، ولی برای ثبت همان تاریخ اصلی را نگه می‌داریم
      // برای تعطیلات آینده، تاریخ میلادی دقیق از فایل استفاده می‌شود
      const actualStart = new Date(holiday.gregorian);
      actualStart.setHours(0,0,0,0);
      const actualEnd = new Date(holiday.gregorian);
      actualEnd.setHours(23,59,59,999);

      const res = await fetch('/api/business/time-offs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAt: actualStart.toISOString(),
          endAt: actualEnd.toISOString(),
          reason: `تعطیل رسمی: ${holiday.title} (${holiday.jalali})`,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت تعطیل رسمی ناموفق'); return; }
      setInfo(`تعطیل رسمی "${holiday.title}" به تقویم شما اضافه شد`);
      load();
    } catch { setError('خطای شبکه'); }
  }

  async function addBulkHolidays(holidays) {
    let added = 0;
    for (const h of holidays) {
      try {
        const start = new Date(h.gregorian);
        start.setHours(0,0,0,0);
        const end = new Date(h.gregorian);
        end.setHours(23,59,59,999);
        const res = await fetch('/api/business/time-offs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startAt: start.toISOString(), endAt: end.toISOString(), reason: `تعطیل رسمی: ${h.title} (${h.jalali})` }),
        });
        const data = await res.json();
        if (data.ok) added++;
      } catch {}
    }
    setInfo(`${added} تعطیل رسمی به تقویم اضافه شد`);
    load();
  }

  async function removeOff(id) {
    await fetch(`/api/business/time-offs?id=${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;

  // فیلتر تعطیلات
  let filteredHolidays = [];
  if (holidayFilter === 'upcoming') filteredHolidays = getUpcomingHolidays(120);
  else if (holidayFilter === '1404') filteredHolidays = OFFICIAL_HOLIDAYS.filter((h) => h.jalali.startsWith('1404-'));
  else if (holidayFilter === '1405') filteredHolidays = OFFICIAL_HOLIDAYS.filter((h) => h.jalali.startsWith('1405-'));
  else if (holidayFilter === '1403') filteredHolidays = OFFICIAL_HOLIDAYS.filter((h) => h.jalali.startsWith('1403-'));
  else filteredHolidays = OFFICIAL_HOLIDAYS;

  const isAlreadyAdded = (holiday) => {
    return timeOffs.some((t) => t.reason && t.reason.includes(holiday.title) && t.reason.includes(holiday.jalali));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">زمان‌بندی و تعطیلات رسمی</h1>
        <p className="text-sm text-muted-foreground mt-1">ساعات کاری هفتگی + مرخصی‌ها + تعطیلات رسمی ایران (قمری و شمسی)</p>
      </div>

      <Card>
        <CardHeader><CardTitle>ساعات کاری هفتگی</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {hours.map((h) => {
            const day = DAYS.find((d) => d.id === h.dayOfWeek);
            return (
              <div key={h.dayOfWeek} className={cn('flex flex-wrap items-center gap-2 rounded-xl border p-3', h.isOff ? 'bg-muted/50 border-border' : 'border-border bg-white')}>
                <span className="w-20 text-sm font-semibold">{day?.label}</span>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!h.isOff} onChange={(e) => updateDay(h.dayOfWeek, { isOff: !e.target.checked })} className="accent-teal-600" />باز</label>
                <input type="time" dir="ltr" disabled={h.isOff} value={h.startTime} onChange={(e) => updateDay(h.dayOfWeek, { startTime: e.target.value })} className="h-9 rounded-lg border border-border px-2 text-sm disabled:opacity-40" />
                <span className="text-xs text-muted-foreground">تا</span>
                <input type="time" dir="ltr" disabled={h.isOff} value={h.endTime} onChange={(e) => updateDay(h.dayOfWeek, { endTime: e.target.value })} className="h-9 rounded-lg border border-border px-2 text-sm disabled:opacity-40" />
              </div>
            );
          })}
          <Button onClick={saveHours} loading={saving} className="w-full sm:w-auto">ذخیره ساعات</Button>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🇮🇷 تعطیلات رسمی تقویم ایران</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">تعطیلات مصوب شورای فرهنگ عمومی — با یک کلیک به عنوان تعطیلی کسب‌وکارت اضافه کن. موتور رزرو به صورت خودکار آن روز را می‌بندد.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'upcoming', label: 'پیش رو (۹۰ روز)' },
              { id: '1405', label: '۱۴۰۵' },
              { id: '1404', label: '۱۴۰۴' },
              { id: '1403', label: '۱۴۰۳' },
              { id: 'all', label: 'همه' },
            ].map((f) => (
              <button key={f.id} onClick={() => setHolidayFilter(f.id)} className={cn('h-8 rounded-full px-3 text-xs font-bold border', holidayFilter === f.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-border')}>
                {f.label}
              </button>
            ))}
            <Button size="sm" variant="secondary" onClick={() => addBulkHolidays(filteredHolidays.filter((h) => !isAlreadyAdded(h)))} className="mr-auto">
              افزودن همه ({filteredHolidays.filter((h) => !isAlreadyAdded(h)).length}) به تقویم
            </Button>
          </div>

          <div className="grid gap-2 max-h-[400px] overflow-auto pr-1">
            {filteredHolidays.map((h) => {
              const added = isAlreadyAdded(h);
              const isPast = new Date(h.gregorian) < new Date();
              return (
                <div key={h.jalali + h.title} className={cn('flex items-center justify-between gap-3 rounded-xl border p-3 text-sm', added ? 'bg-green-50 border-green-200' : isPast ? 'bg-muted/30 border-border opacity-60' : 'bg-white border-border hover:border-amber-300')}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold flex items-center gap-2">
                      {h.title}
                      {added && <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full">اضافه شد</span>}
                      {isPast && <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full">گذشته</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {h.jalali} • {new Date(h.gregorian).toLocaleDateString('fa-IR')} • {new Date(h.gregorian).toLocaleDateString('fa-IR', { weekday: 'long' })}
                    </p>
                  </div>
                  <Button size="sm" variant={added ? 'secondary' : 'primary'} disabled={added} onClick={() => addHolidayAsTimeOff(h)} className="shrink-0">
                    {added ? '✓' : '+ افزودن'}
                  </Button>
                </div>
              );
            })}
            {filteredHolidays.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">تعطیلی‌ای در این بازه نیست</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>مرخصی / تعطیلات ثبت‌شده کسب‌وکار</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addTimeOff} className="grid gap-2 sm:grid-cols-2">
            <Input label="شروع" type="datetime-local" value={offForm.startAt} onChange={(e) => setOffForm({ ...offForm, startAt: e.target.value })} required />
            <Input label="پایان" type="datetime-local" value={offForm.endAt} onChange={(e) => setOffForm({ ...offForm, endAt: e.target.value })} required />
            <div className="sm:col-span-2"><Input label="دلیل (اختیاری)" value={offForm.reason} onChange={(e) => setOffForm({ ...offForm, reason: e.target.value })} placeholder="مثلا: تعمیرات، مرخصی شخصی، تعطیل رسمی..." /></div>
            <Button type="submit" className="sm:col-span-2">افزودن مرخصی دستی</Button>
          </form>

          <div className="space-y-2">
            {timeOffs.length === 0 && <p className="text-sm text-muted-foreground">مرخصی ثبت نشده — از بالا تعطیلات رسمی را اضافه کن</p>}
            {timeOffs.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{new Date(t.startAt).toLocaleString('fa-IR')} → {new Date(t.endAt).toLocaleString('fa-IR')}</p>
                  {t.reason && <p className="text-xs text-muted-foreground mt-1">{t.reason}</p>}
                </div>
                <Button size="sm" variant="danger" onClick={() => removeOff(t.id)}>حذف</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {info && <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">{info}</div>}
    </div>
  );
}
