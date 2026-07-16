'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function LoyaltyManager() {
  const [settings, setSettings] = useState(null);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [codeForm, setCodeForm] = useState({
    code: '',
    type: 'percent',
    value: '10',
    maxUses: '',
    note: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        fetch('/api/business/loyalty'),
        fetch('/api/business/discounts'),
      ]);
      const sData = await sRes.json();
      const dData = await dRes.json();
      if (sData.ok) setSettings(sData.settings);
      if (dData.ok) setCodes(dData.codes || []);
    } catch {
      setError('بارگذاری ناموفق');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSettings(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch('/api/business/loyalty', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: settings.enabled,
          pointsPerThousand: Number(settings.pointsPerThousand),
          minRedeemPoints: Number(settings.minRedeemPoints),
          pointValueToman: Number(settings.pointValueToman),
          welcomePoints: Number(settings.welcomePoints),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'ذخیره ناموفق');
        return;
      }
      setSettings(data.settings);
      setInfo('تنظیمات باشگاه ذخیره شد');
    } catch {
      setError('خطای شبکه');
    } finally {
      setSaving(false);
    }
  }

  async function createCode(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/business/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeForm.code,
          type: codeForm.type,
          value: Number(codeForm.value),
          maxUses: codeForm.maxUses ? Number(codeForm.maxUses) : null,
          note: codeForm.note || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'ایجاد کد ناموفق');
        return;
      }
      setCodeForm({
        code: '',
        type: 'percent',
        value: '10',
        maxUses: '',
        note: '',
      });
      load();
    } catch {
      setError('خطای شبکه');
    }
  }

  async function toggleCode(id, isActive) {
    await fetch('/api/business/discounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    });
    load();
  }

  if (loading || !settings) {
    return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">باشگاه مشتریان</h1>
        <p className="text-sm text-muted-foreground mt-1">
          امتیاز وفاداری و کدهای تخفیف
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تنظیمات امتیاز</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSettings} className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-teal-600"
                checked={settings.enabled}
                onChange={(e) =>
                  setSettings({ ...settings, enabled: e.target.checked })
                }
              />
              فعال‌سازی باشگاه مشتریان
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="امتیاز / هر ۱۰۰۰ ت"
                type="number"
                min={0}
                value={settings.pointsPerThousand}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pointsPerThousand: e.target.value,
                  })
                }
              />
              <Input
                label="امتیاز خوش‌آمد"
                type="number"
                min={0}
                value={settings.welcomePoints}
                onChange={(e) =>
                  setSettings({ ...settings, welcomePoints: e.target.value })
                }
              />
              <Input
                label="حداقل برای استفاده"
                type="number"
                min={0}
                value={settings.minRedeemPoints}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minRedeemPoints: e.target.value,
                  })
                }
              />
              <Input
                label="ارزش هر امتیاز (ت)"
                type="number"
                min={0}
                value={settings.pointValueToman}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pointValueToman: e.target.value,
                  })
                }
              />
            </div>
            <Button type="submit" loading={saving}>
              ذخیره تنظیمات
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>کد تخفیف جدید</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createCode} className="space-y-3">
            <Input
              label="کد"
              dir="ltr"
              value={codeForm.code}
              onChange={(e) =>
                setCodeForm({ ...codeForm, code: e.target.value })
              }
              placeholder="SUMMER10"
              required
            />
            <div className="flex gap-2">
              {[
                { id: 'percent', label: 'درصدی' },
                { id: 'fixed', label: 'مبلغ ثابت' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCodeForm({ ...codeForm, type: t.id })}
                  className={cn(
                    'h-9 rounded-lg border px-3 text-sm',
                    codeForm.type === t.id
                      ? 'border-primary bg-teal-50'
                      : 'border-border',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label={codeForm.type === 'percent' ? 'درصد' : 'مبلغ (تومان)'}
                type="number"
                min={1}
                value={codeForm.value}
                onChange={(e) =>
                  setCodeForm({ ...codeForm, value: e.target.value })
                }
                required
              />
              <Input
                label="سقف استفاده (اختیاری)"
                type="number"
                min={1}
                value={codeForm.maxUses}
                onChange={(e) =>
                  setCodeForm({ ...codeForm, maxUses: e.target.value })
                }
              />
            </div>
            <Input
              label="یادداشت"
              value={codeForm.note}
              onChange={(e) =>
                setCodeForm({ ...codeForm, note: e.target.value })
              }
            />
            <Button type="submit" className="w-full">
              ایجاد کد
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="font-bold">کدهای فعال</h2>
        {codes.length === 0 && (
          <p className="text-sm text-muted-foreground">کدی ثبت نشده</p>
        )}
        {codes.map((c) => (
          <Card key={c.id} className={!c.isActive ? 'opacity-50' : ''}>
            <CardContent className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono font-bold" dir="ltr">
                  {c.code}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.type === 'percent' ? `${c.value}٪` : `${c.value} ت`} ·
                  استفاده {c.usedCount}
                  {c.maxUses != null ? `/${c.maxUses}` : ''}
                  {c.note ? ` · ${c.note}` : ''}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toggleCode(c.id, !c.isActive)}
              >
                {c.isActive ? 'غیرفعال' : 'فعال'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

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
