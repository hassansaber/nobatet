'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ImageUploader, GalleryUploader } from '@/components/ui/ImageUploader';

const THEMES = [
  { primary: '#0284C7', secondary: '#0EA5E9', accent: '#059669', name: 'آبی آسمانی (پیشنهادی)' },
  { primary: '#0d9488', secondary: '#0f766e', accent: '#f59e0b', name: 'فیروزه‌ای کلاسیک' },
  { primary: '#7c3aed', secondary: '#5b21b6', accent: '#f472b6', name: 'بنفش' },
  { primary: '#dc2626', secondary: '#991b1b', accent: '#fbbf24', name: 'قرمز' },
  { primary: '#2563eb', secondary: '#1d4ed8', accent: '#34d399', name: 'آبی پررنگ' },
  { primary: '#ea580c', secondary: '#c2410c', accent: '#0ea5e9', name: 'نارنجی' },
  { primary: '#111827', secondary: '#000', accent: '#0284C7', name: 'مشکی مدرن' },
];

export function SettingsForm() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [ownerAvatar, setOwnerAvatar] = useState('');
  const [qrOpen, setQrOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business/settings');
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'خطا'); return; }
      const b = data.business;
      setForm({
        name: b.name || '',
        slug: b.slug || '',
        description: b.description || '',
        phone: b.phone || '',
        city: b.city || '',
        address: b.address || '',
        latitude: b.latitude || '',
        longitude: b.longitude || '',
        logoUrl: b.logoUrl || '',
        bannerUrl: b.bannerUrl || '',
        galleryUrls: Array.isArray(b.galleryUrls) ? b.galleryUrls : (b.galleryUrls ? [b.galleryUrls].flat() : []),
        cancellationPolicy: b.cancellationPolicy || '',
        depositPercent: String(b.depositPercent ?? 100),
        cardNumber: b.cardNumber || '',
        cardHolderName: b.cardHolderName || '',
        theme: b.theme || THEMES[0],
        landingFeatures: b.landingFeatures || { gallery: true, reviews: true, about: true, services: true },
      });
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const meData = await meRes.json();
        if (meData.ok && meData.user?.avatarUrl) setOwnerAvatar(meData.user.avatarUrl);
      } catch {}
    } catch { setError('بارگذاری ناموفق'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e) {
    e.preventDefault();
    setSaving(true); setError(''); setInfo('');
    try {
      const res = await fetch('/api/business/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, depositPercent: Number(form.depositPercent) }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ذخیره ناموفق'); return; }
      setInfo('تنظیمات ذخیره شد ✓ - تصاویر بهینه‌شده ذخیره شدند');
      if (data.business?.slug) setForm((f) => ({ ...f, slug: data.business.slug }));
      if (ownerAvatar) {
        await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarUrl: ownerAvatar }) }).catch(()=>{});
      }
    } catch { setError('خطای شبکه'); } finally { setSaving(false); }
  }

  if (loading || !form) return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';
  const isLocal = baseDomain.includes('localhost') || baseDomain.startsWith('127.');
  const protocol = isLocal ? 'http' : 'https';
  const landingUrl = `${form.slug || 'demo'}.business.${baseDomain}`;
  const qrData = `${protocol}://${landingUrl}`;

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black">تنظیمات کسب‌وکار • آپلود مستقیم</h1>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setQrOpen(!qrOpen)}>QR کد</Button>
          <Button type="submit" loading={saving} size="sm">ذخیره همه</Button>
        </div>
      </div>

      {qrOpen && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardHeader><CardTitle className="text-sm">QR کد لندینگ</CardTitle></CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`} alt="QR" className="size-40 rounded-xl border bg-white p-2" />
            <div className="space-y-2 text-sm flex-1">
              <p className="font-mono text-xs break-all" dir="ltr">{qrData}</p>
              <p className="text-muted-foreground text-xs">چاپ کنید، مشتری اسکن → رزرو مستقیم</p>
              <a href={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(qrData)}&download=1`} target="_blank" className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-bold text-white">دانلود HD</a>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>پروفایل پایه</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="نام کسب‌وکار" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="اسلاگ ساب‌دامین" dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} hint={`${form.slug || '...'}.business.nobatet.com`} />
            <Input label="شهر" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="تلفن" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Input label="آدرس" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="خیابان، پلاک..." />
          <div>
            <label className="text-sm font-medium block mb-2">توضیحات</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full min-h-20 rounded-xl border border-border p-3 text-sm" placeholder="خدمات کسب‌وکار..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>تصاویر کسب‌وکار — آپلود مستقیم + بهینه‌سازی (WebP)</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <ImageUploader label="عکس صاحب کسب‌وکار (آواتار)" value={ownerAvatar} onChange={setOwnerAvatar} type="avatar" accept="image/*" hint="عکس پرسنلی مالک — 400x400 بهینه می‌شود" />
          <ImageUploader label="لوگو کسب‌وکار" value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} type="logo" accept="image/*" hint="لوگو مربعی PNG/WebP — 512x512 بهینه می‌شود، پس‌زمینه شفاف حفظ می‌شود" />
          <ImageUploader label="بنر اصلی لندینگ (بالای صفحه)" value={form.bannerUrl} onChange={(v) => setForm({ ...form, bannerUrl: v })} type="banner" accept="image/*,video/*" hint="تصویر یا ویدیو کوتاه بنر — 1280x720 بهینه می‌شود. می‌توانید ویدیو 10-15 ثانیه آپلود کنید!" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>گالری تصاویر و ویدیوهای محیط کار</CardTitle></CardHeader>
        <CardContent>
          <GalleryUploader values={form.galleryUrls || []} onChange={(vals) => setForm({ ...form, galleryUrls: vals })} type="gallery" />
          <p className="text-[11px] text-muted-foreground mt-3">می‌توانید تصویر و ویدیو (mp4/webm) آپلود کنید. هر فایل به صورت خودکار بهینه (WebP 1024px) و در <code>/uploads/gallery/</code> ذخیره می‌شود. ویدیوها تا ۵۰MB.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>موقعیت روی نقشه</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" dir="ltr" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="35.6892" />
            <Input label="Longitude" dir="ltr" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="51.3890" />
          </div>
          <div className="rounded-xl overflow-hidden border h-[240px] relative bg-slate-100">
            <iframe title="map" className="absolute inset-0 w-full h-full border-0" loading="lazy" src={form.latitude && form.longitude ? `https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed` : `https://maps.google.com/maps?q=${encodeURIComponent(form.address + ' ' + form.city)}&z=13&output=embed`} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <a href={`https://www.google.com/maps/search/?api=1&query=${form.latitude && form.longitude ? `${form.latitude},${form.longitude}` : encodeURIComponent(form.address + ' ' + form.city)}`} target="_blank" className="text-primary font-bold hover:underline">Google Maps →</a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>تم رنگی</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button key={t.name} type="button" onClick={() => setForm({ ...form, theme: t })} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: form.theme?.primary === t.primary ? t.primary : undefined, boxShadow: form.theme?.primary === t.primary ? `0 0 0 2px ${t.primary}33` : undefined }}>
                <span className="size-5 rounded-full" style={{ background: t.primary }} />{t.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>پرداخت و قوانین</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input label="درصد بیعانه" type="number" min={0} max={100} value={form.depositPercent} onChange={(e) => setForm({ ...form, depositPercent: e.target.value })} />
          <Input label="شماره کارت" dir="ltr" value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} />
          <Input label="نام صاحب کارت" value={form.cardHolderName} onChange={(e) => setForm({ ...form, cardHolderName: e.target.value })} />
          <div className="space-y-1.5"><label className="block text-sm font-medium">سیاست لغو</label><textarea className="w-full min-h-24 rounded-xl border border-border p-3 text-sm" value={form.cancellationPolicy} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>بخش‌های لندینگ</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.keys(form.landingFeatures).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal-600" checked={Boolean(form.landingFeatures[key])} onChange={(e) => setForm({ ...form, landingFeatures: { ...form.landingFeatures, [key]: e.target.checked } })} />{key}</label>
          ))}
        </CardContent>
      </Card>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {info && <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">{info}</div>}

      <Button type="submit" loading={saving} className="w-full sm:w-auto">ذخیره همه تصاویر + تنظیمات</Button>
    </form>
  );
}
