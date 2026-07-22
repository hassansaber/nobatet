'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function InviteAcceptClient({ token, invite }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  async function accept() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'خطا'); return; }
      setOk(true);
      setTimeout(() => router.push('/business'), 1200);
    } catch { setError('خطای شبکه'); } finally { setLoading(false); }
  }

  if (ok) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full"><CardContent className="py-8 text-center"><p className="font-black text-green-700">به تیم اضافه شدی ✓</p><p className="text-sm text-muted-foreground mt-2">در حال انتقال به داشبورد...</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader><CardTitle>دعوت به تیم - نقش {invite.role}</CardTitle><p className="text-xs text-muted-foreground mt-1">برای بیزنس {invite.businessId.slice(0,8)}... - دعوت برای {invite.emailOrPhone}</p></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-6">مدیر شما را به عنوان <strong>{invite.role === 'manager' ? 'مدیر' : 'کارمند'}</strong> دعوت کرده. با پذیرش، به تیم اضافه می‌شوی و سشن‌ات رفرش می‌شود.</p>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
          <Button className="w-full" loading={loading} onClick={accept}>پذیرش دعوت</Button>
          <p className="text-[10px] text-muted-foreground text-center">اگر حسابی با این شماره نداری، ابتدا ثبت‌نام کن سپس دوباره همین لینک را باز کن.</p>
        </CardContent>
      </Card>
    </div>
  );
}
