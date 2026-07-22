'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ImageUploader, GalleryUploader } from '@/components/ui/ImageUploader';
import { cn } from '@/lib/utils';

const THEMES = [
  { primary: '#0284C7', secondary: '#0EA5E9', accent: '#059669', name: 'آبی آسمانی' },
  { primary: '#0d9488', secondary: '#0f766e', accent: '#f59e0b', name: 'فیروزه‌ای' },
  { primary: '#7c3aed', secondary: '#5b21b6', accent: '#f472b6', name: 'بنفش' },
  { primary: '#dc2626', secondary: '#991b1b', accent: '#fbbf24', name: 'قرمز' },
  { primary: '#2563eb', secondary: '#1d4ed8', accent: '#34d399', name: 'آبی پررنگ' },
  { primary: '#ea580c', secondary: '#c2410c', accent: '#0ea5e9', name: 'نارنجی' },
  { primary: '#111827', secondary: '#000', accent: '#0284C7', name: 'مشکی' },
];

const TABS = [
  { id: 'general', label: 'پروفایل' },
  { id: 'branding', label: 'برندینگ' },
  { id: 'gallery', label: 'گالری' },
  { id: 'location', label: 'موقعیت' },
  { id: 'payments', label: 'پرداخت' },
  { id: 'features', label: 'فیچرها' },
  { id: 'domain', label: 'دامنه' },
  { id: 'instagram', label: 'اینستاگرام' },
];

export function SettingsForm() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [ownerAvatar, setOwnerAvatar] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const saveTimeoutRef = useRef(null);

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
        customDomain: b.customDomain || '',
      });
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const meData = await meRes.json();
        if (meData.ok && meData.user?.avatarUrl) setOwnerAvatar(meData.user.avatarUrl);
      } catch {}
    } catch { setError('بارگذاری ناموفق'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // autosave debounce
  useEffect(() => {
    if (!form || loading) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch('/api/business/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, depositPercent: Number(form.depositPercent) }),
        });
        const data = await res.json();
        if (data.ok) {
          setInfo('ذخیره خودکار ✓');
          setTimeout(() => setInfo(''), 2000);
        }
      } catch {} finally { setSaving(false); }
    }, 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [form]);

  async function save(e) {
    if (e) e.preventDefault();
    setSaving(true); setError(''); setInfo('');
    try {
      const res = await fetch('/api/business/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, depositPercent: Number(form.depositPercent) }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ذخیره ناموفق'); return; }
      setInfo('تنظیمات ذخیره شد ✓');
      if (data.business?.slug) setForm((f) => ({ ...f, slug: data.business.slug }));
      if (ownerAvatar) {
        await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarUrl: ownerAvatar }) }).catch(()=>{});
      }
    } catch { setError('خطای شبکه'); } finally { setSaving(false); }
  }

  if (loading || !form) return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';
  const isLocal = baseDomain.includes('localhost') || baseDomain.startsWith('127.') || baseDomain.includes('lvh.me');
  const protocol = isLocal ? 'http' : 'https';
  const landingUrl = `${form.slug || 'demo'}.${baseDomain}`;
  const qrData = `${protocol}://${landingUrl}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black">تنظیمات کسب‌وکار</h1>
        <div className="flex gap-2 items-center">
          <span className="text-[11px] text-muted-foreground">{saving ? 'در حال ذخیره...' : info || 'ذخیره خودکار فعال'}</span>
          <Button type="button" variant="secondary" size="sm" onClick={() => setQrOpen(!qrOpen)}>QR</Button>
          <Button type="button" loading={saving} size="sm" onClick={save}>ذخیره</Button>
        </div>
      </div>

      {qrOpen && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardHeader><CardTitle className="text-sm">QR لندینگ - {qrData}</CardTitle></CardHeader>
          <CardContent className="flex gap-4 items-center">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`} alt="QR" className="size-32 rounded-xl border bg-white p-2" />
            <div className="text-xs break-all" dir="ltr">{qrData}</div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn('whitespace-nowrap rounded-xl px-3 py-2 text-[12px] font-medium border transition-all', activeTab === t.id ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-border hover:bg-slate-50')}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <Card><CardHeader><CardTitle>پروفایل پایه</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="نام کسب‌وکار" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="اسلاگ" dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} hint={`${form.slug || '...'}.nobatet.com`} />
            <Input label="شهر" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="تلفن" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Input label="آدرس" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div><label className="text-sm font-medium">توضیحات</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full min-h-20 rounded-xl border p-3 text-sm" /></div>
          <ImageUploader label="آواتار مالک" value={ownerAvatar} onChange={setOwnerAvatar} type="avatar" accept="image/*" />
        </CardContent></Card>
      )}

      {activeTab === 'branding' && (
        <Card><CardHeader><CardTitle>برندینگ</CardTitle></CardHeader><CardContent className="space-y-5">
          <ImageUploader label="لوگو" value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} type="logo" accept="image/*" />
          <ImageUploader label="بنر" value={form.bannerUrl} onChange={(v) => setForm({ ...form, bannerUrl: v })} type="banner" accept="image/*,video/*" />
          <div><p className="text-sm font-medium mb-2">تم رنگی</p><div className="flex flex-wrap gap-2">{THEMES.map((t) => (<button key={t.name} type="button" onClick={() => setForm({ ...form, theme: t })} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: form.theme?.primary === t.primary ? t.primary : undefined }}><span className="size-5 rounded-full" style={{ background: t.primary }} />{t.name}</button>))}</div></div>
        </CardContent></Card>
      )}

      {activeTab === 'gallery' && (
        <Card><CardHeader><CardTitle>گالری</CardTitle></CardHeader><CardContent>
          <GalleryUploader values={form.galleryUrls || []} onChange={(vals) => setForm({ ...form, galleryUrls: vals })} type="gallery" />
        </CardContent></Card>
      )}

      {activeTab === 'location' && (
        <Card><CardHeader><CardTitle>موقعیت</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><Input label="Latitude" dir="ltr" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /><Input label="Longitude" dir="ltr" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></div>
          <div className="rounded-xl overflow-hidden border h-[240px] relative"><iframe title="map" className="absolute inset-0 w-full h-full border-0" loading="lazy" src={`https://maps.google.com/maps?q=${form.latitude && form.longitude ? `${form.latitude},${form.longitude}` : encodeURIComponent(form.address + ' ' + form.city)}&z=15&output=embed`} /></div>
        </CardContent></Card>
      )}

      {activeTab === 'payments' && (
        <Card><CardHeader><CardTitle>پرداخت و قوانین</CardTitle></CardHeader><CardContent className="space-y-3">
          <Input label="درصد بیعانه" type="number" value={form.depositPercent} onChange={(e) => setForm({ ...form, depositPercent: e.target.value })} />
          <Input label="شماره کارت" dir="ltr" value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} />
          <Input label="نام صاحب کارت" value={form.cardHolderName} onChange={(e) => setForm({ ...form, cardHolderName: e.target.value })} />
          <div><label className="text-sm font-medium">سیاست لغو</label><textarea className="w-full min-h-24 rounded-xl border p-3 text-sm" value={form.cancellationPolicy} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })} /></div>
        </CardContent></Card>
      )}

      {activeTab === 'features' && (
        <Card><CardHeader><CardTitle>بخش‌های لندینگ</CardTitle></CardHeader><CardContent className="space-y-2">
          {Object.keys(form.landingFeatures).map((key) => (<label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.landingFeatures[key])} onChange={(e) => setForm({ ...form, landingFeatures: { ...form.landingFeatures, [key]: e.target.checked } })} />{key}</label>))}
        </CardContent></Card>
      )}

      {activeTab === 'domain' && (
        <Card><CardHeader><CardTitle>دامنه اختصاصی (BYO)</CardTitle></CardHeader><CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground">برای برند حرفه‌ای: دامنه خودت مثل moristyle.com را به {landingUrl} وصل کن. فعلاً فقط ذخیره می‌شود، در فاز بعد ACME auto SSL اضافه می‌شود.</p>
          <Input label="Custom Domain" dir="ltr" placeholder="moristyle.com یا app.moristyle.com" value={form.customDomain} onChange={(e) => setForm({ ...form, customDomain: e.target.value })} />
          <p className="text-[10px] text-muted-foreground">راهنما cPanel: یک CNAME بساز: {form.customDomain || 'example.com'} → {landingUrl} یا A رکورد به IP هاست.</p>
        </CardContent></Card>
      )}

      {activeTab === 'instagram' && (
        <Card><CardHeader><CardTitle>اینستاگرام - دکمه رزرو</CardTitle></CardHeader><CardContent className="space-y-3">
          <p className="text-[12px]">لینک لندینگ را در بیوی اینستا بگذار:</p>
          <div className="font-mono text-xs bg-slate-50 border p-2 rounded" dir="ltr">{qrData}</div>
          <Button size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(qrData)}>کپی لینک</Button>
          <p className="text-[11px] text-muted-foreground">راهنما: اینستا → Edit Profile → Website → همین لینک + در استوری لینک استیکر بگذار.</p>
        </CardContent></Card>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {info && <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">{info}</div>}
    </div>
  );
}
