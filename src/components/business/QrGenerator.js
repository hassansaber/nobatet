'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function QrGenerator() {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/business/settings');
        const data = await res.json();
        if (data.ok) setBusiness(data.business);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;
  if (!business) return <p className="text-sm text-red-600">کسب‌وکار یافت نشد</p>;

  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';
  const isLocal = base.includes('localhost') || base.startsWith('127.');
  const protocol = isLocal ? 'http' : 'https';
  const url = `${protocol}://${business.slug}.business.${base}`;
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
  const qrHd = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(url)}`;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <h1 className="text-xl font-black">QR کد لندینگ کسب‌وکار</h1>
      <p className="text-sm text-muted-foreground">لینک لندینگت رو به QR تبدیل کن، چاپ کن و نصب کن. مشتری اسکن → مستقیم رزرو.</p>

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-900 text-white"><CardTitle className="text-base">🔗 {business.name}</CardTitle><p className="text-xs text-slate-400 mt-1" dir="ltr">{url}</p></CardHeader>
        <CardContent className="py-6 flex flex-col items-center gap-4">
          <div className="rounded-2xl border-4 border-slate-900 p-3 bg-white shadow-xl">
            <img src={qrApi} alt="QR" className="size-[260px]" />
          </div>
          <p className="font-mono text-xs bg-slate-50 border rounded-lg px-3 py-1.5" dir="ltr">{url}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a href={qrHd} target="_blank" className="inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white">دانلود HD 1000x1000</a>
            <a href={qrApi} target="_blank" className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-5 text-sm font-bold">دانلود 400x400</a>
            <Button variant="secondary" size="sm" onClick={() => navigator.clipboard?.writeText(url)}>کپی لینک</Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>🖨️ چاپ</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">راهنمای چاپ</CardTitle></CardHeader>
        <CardContent className="text-xs leading-7 text-muted-foreground space-y-2">
          <p>۱. QR با کیفیت HD دانلود کن</p>
          <p>۲. روی پوستر، استند، کارت ویزیت یا شیشه مغازه چاپ کن</p>
          <p>۳. زیرش بنویس: «برای رزرو آنلاین اسکن کنید»</p>
          <p>۴. تست کن با گوشی اسکن شود</p>
        </CardContent>
      </Card>

      <Card className="bg-teal-50 border-teal-200">
        <CardContent className="py-4 text-xs">
          💡 نکته: این QR به لندینگ {business.slug}.business.{base} اشاره دارد که در تنظیمات قابل تغییر است (اسلاگ). اگر اسلاگ رو عوض کنی QR جدید بساز.
        </CardContent>
      </Card>
    </div>
  );
}
