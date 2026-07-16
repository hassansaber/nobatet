'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

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
  const [offForm, setOffForm] = useState({
    startAt: '',
    endAt: '',
    reason: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, tRes] = await Promise.all([
        fetch('/api/business/hours'),
        fetch('/api/business/time-offs'),
      ]);
      const hData = await hRes.json();
      const tData = await tRes.json();
      if (hData.ok && hData.hours?.length) {
        const map = new Map(hData.hours.map((h) => [h.dayOfWeek, h]));
        setHours(
          DAYS.map((d) => {
            const h = map.get(d.id);
            return h
              ? {
                  dayOfWeek: d.id,
                  startTime: h.startTime,
                  endTime: h.endTime,
                  isOff: h.isOff,
                }
              : {
                  dayOfWeek: d.id,
                  startTime: '09:00',
                  endTime: '18:00',
                  isOff: true,
                };
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

  useEffect(() => {
    load();
  }, [load]);

  function updateDay(dayOfWeek, patch) {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)),
    );
  }

  async function saveHours() {
    setSaving(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch('/api/business/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'ذخیره ناموفق');
        return;
      }
      setInfo('ساعات کاری ذخیره شد');
    } catch {
      setError('خطای شبکه');
    } finally {
      setSaving(false);
    }
  }

  async function addTimeOff(e) {
    e.preventDefault();
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
      if (!data.ok) {
        setError(data.error || 'ثبت مرخصی ناموفق');
        return;
      }
      setOffForm({ startAt: '', endAt: '', reason: '' });
      load();
    } catch {
      setError('خطای شبکه');
    }
  }

  async function removeOff(id) {
    await fetch(`/api/business/time-offs?id=${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">زمان‌بندی</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ساعات کاری بیزنس (شنبه=۰ … جمعه=۶) و مرخصی‌ها
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ساعات کاری هفتگی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hours.map((h) => {
            const day = DAYS.find((d) => d.id === h.dayOfWeek);
            return (
              <div
                key={h.dayOfWeek}
                className={cn(
                  'flex flex-wrap items-center gap-2 rounded-xl border p-3',
                  h.isOff ? 'bg-muted/50 border-border' : 'border-border bg-white',
                )}
              >
                <span className="w-20 text-sm font-semibold">{day?.label}</span>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={!h.isOff}
                    onChange={(e) =>
                      updateDay(h.dayOfWeek, { isOff: !e.target.checked })
                    }
                    className="accent-teal-600"
                  />
                  باز
                </label>
                <input
                  type="time"
                  dir="ltr"
                  disabled={h.isOff}
                  value={h.startTime}
                  onChange={(e) =>
                    updateDay(h.dayOfWeek, { startTime: e.target.value })
                  }
                  className="h-9 rounded-lg border border-border px-2 text-sm disabled:opacity-40"
                />
                <span className="text-xs text-muted-foreground">تا</span>
                <input
                  type="time"
                  dir="ltr"
                  disabled={h.isOff}
                  value={h.endTime}
                  onChange={(e) =>
                    updateDay(h.dayOfWeek, { endTime: e.target.value })
                  }
                  className="h-9 rounded-lg border border-border px-2 text-sm disabled:opacity-40"
                />
              </div>
            );
          })}
          <Button onClick={saveHours} loading={saving} className="w-full sm:w-auto">
            ذخیره ساعات
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>مرخصی / تعطیلات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addTimeOff} className="grid gap-2 sm:grid-cols-2">
            <Input
              label="شروع"
              type="datetime-local"
              value={offForm.startAt}
              onChange={(e) =>
                setOffForm({ ...offForm, startAt: e.target.value })
              }
              required
            />
            <Input
              label="پایان"
              type="datetime-local"
              value={offForm.endAt}
              onChange={(e) => setOffForm({ ...offForm, endAt: e.target.value })}
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="دلیل (اختیاری)"
                value={offForm.reason}
                onChange={(e) =>
                  setOffForm({ ...offForm, reason: e.target.value })
                }
              />
            </div>
            <Button type="submit" className="sm:col-span-2">
              افزودن مرخصی
            </Button>
          </form>

          <div className="space-y-2">
            {timeOffs.length === 0 && (
              <p className="text-sm text-muted-foreground">مرخصی ثبت نشده</p>
            )}
            {timeOffs.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {new Date(t.startAt).toLocaleString('fa-IR')} →{' '}
                    {new Date(t.endAt).toLocaleString('fa-IR')}
                  </p>
                  {t.reason && (
                    <p className="text-xs text-muted-foreground">{t.reason}</p>
                  )}
                </div>
                <Button size="sm" variant="danger" onClick={() => removeOff(t.id)}>
                  حذف
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {info}
        </div>
      )}
    </div>
  );
}
