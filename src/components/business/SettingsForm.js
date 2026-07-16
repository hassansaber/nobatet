'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const THEMES = [
  { primary: '#0d9488', secondary: '#0f766e', accent: '#f59e0b', name: 'فیروزه‌ای' },
  { primary: '#7c3aed', secondary: '#5b21b6', accent: '#f472b6', name: 'بنفش' },
  { primary: '#dc2626', secondary: '#991b1b', accent: '#fbbf24', name: 'قرمز' },
  { primary: '#2563eb', secondary: '#1d4ed8', accent: '#34d399', name: 'آبی' },
  { primary: '#ea580c', secondary: '#c2410c', accent: '#0ea5e9', name: 'نارنجی' },
];

export function SettingsForm() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business/settings');
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا');
        return;
      }
      const b = data.business;
      setForm({
        name: b.name || '',
        slug: b.slug || '',
        description: b.description || '',
        phone: b.phone || '',
        city: b.city || '',
        address: b.address || '',
        cancellationPolicy: b.cancellationPolicy || '',
        depositPercent: String(b.depositPercent ?? 100),
        cardNumber: b.cardNumber || '',
        cardHolderName: b.cardHolderName || '',
        theme: b.theme || THEMES[0],
        landingFeatures: b.landingFeatures || {
          gallery: true,
          reviews: true,
          about: true,
          services: true,
        },
      });
    } catch {
      setError('بارگذاری ناموفق');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch('/api/business/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          depositPercent: Number(form.depositPercent),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'ذخیره ناموفق');
        return;
      }
      setInfo('تنظیمات ذخیره شد');
      if (data.business?.slug) {
        setForm((f) => ({ ...f, slug: data.business.slug }));
      }
    } catch {
      setError('خطای شبکه');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <h1 className="text-xl font-black">تنظیمات کسب‌وکار</h1>

      <Card>
        <CardHeader>
          <CardTitle>پروفایل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            label="نام"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="اسلاگ ساب‌دامین"
            dir="ltr"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            hint="مثال: moribarber → moribarber.business.nobatet.com"
          />
          <Input
            label="توضیح"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="شهر"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="تلفن"
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <Input
            label="آدرس"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تم رنگی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setForm({ ...form, theme: t })}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                style={{
                  borderColor:
                    form.theme?.primary === t.primary ? t.primary : undefined,
                  boxShadow:
                    form.theme?.primary === t.primary
                      ? `0 0 0 2px ${t.primary}33`
                      : undefined,
                }}
              >
                <span
                  className="size-5 rounded-full"
                  style={{ background: t.primary }}
                />
                {t.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>پرداخت و قوانین</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            label="درصد بیعانه"
            type="number"
            min={0}
            max={100}
            value={form.depositPercent}
            onChange={(e) =>
              setForm({ ...form, depositPercent: e.target.value })
            }
          />
          <Input
            label="شماره کارت (کارت‌به‌کارت)"
            dir="ltr"
            value={form.cardNumber}
            onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
          />
          <Input
            label="نام صاحب کارت"
            value={form.cardHolderName}
            onChange={(e) =>
              setForm({ ...form, cardHolderName: e.target.value })
            }
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">سیاست لغو</label>
            <textarea
              className="w-full min-h-24 rounded-xl border border-border p-3 text-sm"
              value={form.cancellationPolicy}
              onChange={(e) =>
                setForm({ ...form, cancellationPolicy: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بخش‌های لندینگ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.keys(form.landingFeatures).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-teal-600"
                checked={Boolean(form.landingFeatures[key])}
                onChange={(e) =>
                  setForm({
                    ...form,
                    landingFeatures: {
                      ...form.landingFeatures,
                      [key]: e.target.checked,
                    },
                  })
                }
              />
              {key}
            </label>
          ))}
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

      <Button type="submit" loading={saving} className="w-full sm:w-auto">
        ذخیره تنظیمات
      </Button>
    </form>
  );
}
