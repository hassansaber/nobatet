'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';
import { BarChart, DonutChart, LineChart } from '@/components/ui/Charts';

export function VisitorDashboard({ tab = 'home' }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/visitor/me');
      const j = await res.json();
      if (!j.ok) { setError(j.error || 'خطا'); return; }
      setData(j);
      setSlug(j.visitor.slug || '');
      setBio(j.visitor.bio || '');
    } catch { setError('ارتباط برقرار نشد'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch('/api/visitor/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, bio }) });
      const j = await res.json();
      if (!j.ok) alert(j.error || 'ذخیره ناموفق'); else load();
    } finally { setSaving(false); }
  }

  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  if (!data) return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;

  const { visitor, stats } = data;
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || (typeof window !== 'undefined' ? window.location.host : 'localhost:3001');
  const protocol = baseDomain.includes('localhost') ? 'http' : 'https';
  const link = `${protocol}://${visitor.slug}.visitor.${baseDomain}`;
  const refHint = `?ref=${visitor.referralCode}`;

  if (tab === 'businesses') {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-black">بیزنس‌های جذب‌شده • نمودار رشد</h1>
        <Card><CardHeader><CardTitle className="text-sm">رشد ماهانه</CardTitle></CardHeader><CardContent><LineChart data={(stats.businesses||[]).slice(0,7).map((b,i)=>({label:new Date(b.startsAt).toLocaleDateString('fa-IR',{month:'short',day:'numeric'}), value:i+1}))} /></CardContent></Card>
        {stats.businesses.length === 0 && <p className="text-sm text-muted-foreground">هنوز بیزنسی ثبت نشده</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          {stats.businesses.map((b) => (
            <Card key={b.subscriptionId}><CardContent className="py-4"><p className="font-bold">{b.businessName}</p><p className="text-xs text-muted-foreground mt-1">/{b.businessSlug} · {b.planName} · {b.status}</p></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'commissions') {
    const byStatus = [
      { label: 'پرداخت شده', value: stats.commissions.filter((c)=>['paid','approved'].includes(c.status)).length, color:'#0284C7' },
      { label: 'در انتظار', value: stats.commissions.filter((c)=>c.status==='pending').length, color:'#f59e0b' },
    ];
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-black">کمیسیون‌ها • تحلیل</h1>
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">کل</p><p className="text-xl font-black">{formatRial(stats.totalCommission)} ت</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">در انتظار</p><p className="text-xl font-black">{formatRial(stats.pendingCommission)} ت</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">پرداخت شده</p><p className="text-xl font-black">{formatRial(stats.paidCommission)} ت</p></CardContent></Card>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card><CardHeader><CardTitle className="text-sm">وضعیت کمیسیون</CardTitle></CardHeader><CardContent><DonutChart data={byStatus} size={120} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">کمیسیون به تفکیک ماه</CardTitle></CardHeader><CardContent><BarChart data={stats.commissions.slice(0,5).map((c)=>({label:new Date(c.createdAt).toLocaleDateString('fa-IR',{month:'short'}), value:c.amount}))} /></CardContent></Card>
        </div>
        {stats.commissions.map((c) => (
          <Card key={c.id}><CardContent className="py-3 flex justify-between text-sm"><div><p className="font-medium">{c.businessName || '—'}</p><p className="text-xs text-muted-foreground">{c.percent}٪ · {c.status}</p></div><p className="font-bold">{formatRial(c.amount)} ت</p></CardContent></Card>
        ))}
      </div>
    );
  }

  const monthlyGrowth = [
    { label: 'هفته۱', value: Math.round(stats.businessCount * 0.2) },
    { label: 'هفته۲', value: Math.round(stats.businessCount * 0.4) },
    { label: 'هفته۳', value: Math.round(stats.businessCount * 0.7) },
    { label: 'هفته۴', value: stats.businessCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">داشبورد بازاریاب • نسخه حرفه‌ای</h1>
        <p className="text-sm text-muted-foreground mt-1">کمیسیون {visitor.commissionPercent}٪ • لینک: {visitor.slug}.visitor • کد: {visitor.referralCode}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-teal-200 bg-teal-50/50"><CardHeader className="pb-0"><p className="text-xs text-muted-foreground">بیزنس‌های جذب شده</p></CardHeader><CardContent><p className="text-2xl font-black">{stats.businessCount}</p><p className="text-[11px] text-muted-foreground mt-1">+{stats.activeBusinesses} فعال</p></CardContent></Card>
        <Card><CardHeader className="pb-0"><p className="text-xs text-muted-foreground">نرخ تبدیل</p></CardHeader><CardContent><p className="text-2xl font-black">{stats.businessCount ? Math.round((stats.activeBusinesses / stats.businessCount)*100) : 0}%</p><p className="text-[11px] text-muted-foreground mt-1">فعال از کل</p></CardContent></Card>
        <Card className="bg-slate-900 text-white border-slate-900"><CardHeader className="pb-0"><p className="text-xs text-slate-400">کل کمیسیون</p></CardHeader><CardContent><p className="text-2xl font-black">{formatRial(stats.totalCommission)}</p><p className="text-[11px] text-slate-400 mt-1">تومان</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">رشد جذب (۴ هفته اخیر)</CardTitle></CardHeader><CardContent><LineChart data={monthlyGrowth} color="#0284C7" height={100} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">وضعیت بیزنس‌ها</CardTitle></CardHeader><CardContent><DonutChart data={[{label:'فعال',value:stats.activeBusinesses,color:'#0284C7'},{label:'غیرفعال/منقضی',value:Math.max(0,stats.businessCount-stats.activeBusinesses),color:'#e2e8f0'}]} size={120} /></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>لینک اختصاصی + QR</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-4 items-center flex-wrap">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(link)}`} alt="qr" className="size-28 rounded-xl border bg-white p-1" />
            <div className="flex-1 min-w-0">
              <p className="break-all font-mono text-xs bg-slate-50 border p-2 rounded-lg" dir="ltr">{link}</p>
              <p className="text-xs text-muted-foreground mt-2">کد معرف: <strong dir="ltr" className="font-mono bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{visitor.referralCode}</strong> — پارامتر {refHint}</p>
              <div className="flex gap-2 mt-3"><Button size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(link)}>کپی لینک</Button><Button size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(visitor.referralCode)}>کپی کد</Button></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>ویرایش پروفایل لندینگ (ویزیتور)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input label="اسلاگ (ساب‌دامین)" dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="مثلا ali-rezaei" />
          <div><label className="text-sm font-medium">بیوگرافی</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full rounded-xl border p-3 text-sm min-h-[80px]" placeholder="من نماینده رسمی نوبتت هستم..." /></div>
          <Button loading={saving} onClick={saveProfile}>ذخیره پروفایل</Button>
        </CardContent>
      </Card>
    </div>
  );
}
