'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function DomainManager() {
  const [form, setForm] = useState({ customDomain: '', slug: '' });
  const [info, setInfo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/business/settings');
      const data = await res.json();
      if (data.ok) setForm({ customDomain: data.business?.customDomain || '', slug: data.business?.slug || '' });
    })();
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/business/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customDomain: form.customDomain }) });
      const data = await res.json();
      if (data.ok) setInfo('ذخیره شد - برای فعال‌سازی نهایی، رکورد CNAME را ست کن و به پشتیبانی اطلاع بده.');
      else setInfo(data.error || 'خطا');
    } catch {} finally { setSaving(false); }
  }

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'nobatet.com';
  const landing = `${form.slug || 'demo'}.${baseDomain}`;

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-lg font-black">دامنه اختصاصی - BYO Domain</h1>
      <Card><CardHeader><CardTitle className="text-sm">دامنه فعلی: {landing}</CardTitle></CardHeader><CardContent className="space-y-3">
        <p className="text-xs leading-6">برای برند حرفه‌ای، می‌توانی دامنه خودت مثل <span className="font-mono bg-slate-100 px-1 rounded">moristyle.com</span> را به نوبتت وصل کنی. فعلاً فقط ذخیره می‌شود، در فاز بعد ACME auto SSL اضافه می‌شود.</p>
        <form onSubmit={save} className="space-y-2">
          <Input label="Custom Domain" dir="ltr" placeholder="moristyle.com یا app.moristyle.com" value={form.customDomain} onChange={(e) => setForm({ ...form, customDomain: e.target.value })} />
          <Button type="submit" loading={saving}>ذخیره</Button>
        </form>
        {form.customDomain && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs leading-6">
            <p className="font-bold">راهنمای cPanel:</p>
            <p>1. در cPanel → Zone Editor یک رکورد بساز:</p>
            <p className="font-mono bg-white border p-1 rounded mt-1" dir="ltr">CNAME: {form.customDomain} → {landing}</p>
            <p className="mt-1">یا اگر apex است (بدون www): A رکورد به IP هاست: <span className="font-mono">{`185.XXX.XXX.XXX (IP هاستت را از cPanel بگیر)`}</span></p>
            <p>2. بعد از 10 دقیقه، به پشتیبانی بگو تا SSL را فعال کند.</p>
          </div>
        )}
        {info && <p className="text-xs text-teal-700 bg-teal-50 border border-teal-200 p-2 rounded-xl">{info}</p>}
      </CardContent></Card>
    </div>
  );
}
