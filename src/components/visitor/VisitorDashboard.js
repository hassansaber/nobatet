'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';

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
      if (!j.ok) {
        setError(j.error || 'خطا');
        return;
      }
      setData(j);
      setSlug(j.visitor.slug || '');
      setBio(j.visitor.bio || '');
    } catch {
      setError('ارتباط برقرار نشد');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch('/api/visitor/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, bio }),
      });
      const j = await res.json();
      if (!j.ok) alert(j.error || 'ذخیره ناموفق');
      else load();
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;
  }

  const { visitor, stats } = data;
  const baseDomain =
    process.env.NEXT_PUBLIC_BASE_DOMAIN ||
    (typeof window !== 'undefined' ? window.location.host : 'localhost:3001');
  const protocol =
    baseDomain.includes('localhost') || baseDomain.startsWith('127.')
      ? 'http'
      : 'https';
  const link = `${protocol}://${visitor.slug}.visitor.${baseDomain}`;
  const refHint = `?ref=${visitor.referralCode}`;

  if (tab === 'businesses') {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-black">بیزنس‌های جذب‌شده</h1>
        {stats.businesses.length === 0 && (
          <p className="text-sm text-muted-foreground">هنوز بیزنسی ثبت نشده</p>
        )}
        {stats.businesses.map((b) => (
          <Card key={b.subscriptionId}>
            <CardContent className="py-4">
              <p className="font-bold">{b.businessName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                /{b.businessSlug} · {b.planName} · {b.status}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tab === 'commissions') {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-black">کمیسیون‌ها</h1>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">کل</p>
              <p className="text-xl font-black">
                {formatRial(stats.totalCommission)} ت
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">در انتظار</p>
              <p className="text-xl font-black">
                {formatRial(stats.pendingCommission)} ت
              </p>
            </CardContent>
          </Card>
        </div>
        {stats.commissions.map((c) => (
          <Card key={c.id}>
            <CardContent className="py-3 flex justify-between text-sm">
              <div>
                <p className="font-medium">{c.businessName || '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {c.percent}٪ · {c.status}
                </p>
              </div>
              <p className="font-bold">{formatRial(c.amount)} ت</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">داشبورد بازاریاب</h1>
        <p className="text-sm text-muted-foreground mt-1">
          کمیسیون شما: {visitor.commissionPercent}٪ از اشتراک‌های فروخته‌شده
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-0">
            <p className="text-xs text-muted-foreground">بیزنس‌ها</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{stats.businessCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <p className="text-xs text-muted-foreground">فعال</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{stats.activeBusinesses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <p className="text-xs text-muted-foreground">کمیسیون</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">
              {formatRial(stats.totalCommission)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لینک اختصاصی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="break-all font-mono text-xs" dir="ltr">
            {link}
          </p>
          <p className="text-xs text-muted-foreground">
            کد معرف:{' '}
            <strong dir="ltr" className="font-mono">
              {visitor.referralCode}
            </strong>{' '}
            — در ثبت‌نام بیزنس با {refHint} یا فیلد referral
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigator.clipboard?.writeText(link)}
          >
            کپی لینک
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ویرایش پروفایل لندینگ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            label="اسلاگ"
            dir="ltr"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <Input
            label="بیو"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <Button loading={saving} onClick={saveProfile}>
            ذخیره
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
