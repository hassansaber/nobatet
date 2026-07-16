'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';

export function ServicesManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    durationMinutes: '45',
    bufferMinutes: '15',
    price: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business/services');
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا');
        return;
      }
      setServices(data.services || []);
    } catch {
      setError('ارتباط برقرار نشد');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/business/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          durationMinutes: Number(form.durationMinutes),
          bufferMinutes: Number(form.bufferMinutes || 0),
          price: Number(form.price || 0),
          description: form.description || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'ذخیره ناموفق');
        return;
      }
      setShowForm(false);
      setForm({
        name: '',
        durationMinutes: '45',
        bufferMinutes: '15',
        price: '',
        description: '',
      });
      load();
    } catch {
      setError('خطای شبکه');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black">خدمات</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'بستن' : 'افزودن خدمت'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>خدمت جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                label="نام خدمت"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="مدت (دقیقه)"
                  type="number"
                  min={5}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: e.target.value })
                  }
                  required
                />
                <Input
                  label="بافر"
                  type="number"
                  min={0}
                  value={form.bufferMinutes}
                  onChange={(e) =>
                    setForm({ ...form, bufferMinutes: e.target.value })
                  }
                />
                <Input
                  label="قیمت (تومان)"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <Input
                label="توضیح"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <Button type="submit" loading={saving} className="w-full">
                ذخیره
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
      )}

      <div className="space-y-2">
        {services.map((s) => (
          <Card key={s.id}>
            <CardContent className="py-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.durationMinutes} دقیقه
                  {s.bufferMinutes ? ` + ${s.bufferMinutes} بافر` : ''}
                  {!s.isActive ? ' · غیرفعال' : ''}
                </p>
              </div>
              <p className="font-bold text-sm whitespace-nowrap">
                {formatRial(s.price)} ت
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
