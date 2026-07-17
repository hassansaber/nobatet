'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function ChooseWorkspaceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [workspaces, setWorkspaces] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/workspaces', { credentials: 'include' });
        const data = await res.json();
        if (!data.ok) { setError(data.error || 'خطا'); return; }
        setWorkspaces(data);
        // دیگر اتوماتیک ریدایرکت نمی‌کنیم حتی اگر یکی باشد — کاربر باید صفحه انتخاب را ببیند
        // فقط اگر next وجود داشت و کاربر می‌خواهد به یک مسیر خاص برود، آن را نگه می‌داریم
      } catch { setError('ارتباط برقرار نشد'); } finally { setLoading(false); }
    })();
  }, []);

  async function handleSelect(ws) {
    try {
      // ذخیره فضای فعال در کوکی غیر httpOnly برای UX
      document.cookie = `nobatet_active_workspace=${encodeURIComponent(ws.businessId || ws.type)}; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
    } catch {}
    const target = next || ws.href || ws.redirectTo || '/me';
    router.push(target);
  }

  if (loading) return <div className="min-h-dvh flex items-center justify-center"><p className="text-sm text-muted-foreground">در حال بارگذاری فضاهای کاری...</p></div>;
  if (error) return <div className="min-h-dvh flex items-center justify-center"><div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div></div>;
  if (!workspaces) return null;

  const { dashboards, session, total } = workspaces;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="mx-auto size-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg">ن</div>
          <h1 className="mt-4 text-2xl font-black">انتخاب فضای کاری</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            سلام {session?.firstName || ''} 👋 شما {total} فضای کاری دارید. کدام را می‌خواهید باز کنید؟
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">یک شماره، چند نقش — بدون نیاز به لاگین مجدد</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {dashboards.map((ws) => (
            <button key={ws.key} onClick={() => handleSelect(ws)} className="text-right rounded-2xl border border-border bg-white p-5 hover:border-primary hover:shadow-md transition-all group text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="size-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: ws.color + '15', color: ws.color }}>
                  {ws.icon}
                </div>
                <span className="text-[10px] bg-slate-100 border px-2 py-0.5 rounded-full">{ws.roleLabel}</span>
              </div>
              <p className="mt-3 font-black text-base">{ws.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ws.desc}</p>
              <p className="mt-3 text-xs font-bold text-primary group-hover:underline">ورود →</p>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-muted-foreground">می‌توانید بعداً از هدر هر داشبورد فضای کاری را عوض کنید</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => router.push('/me')}>رفتن به پروفایل شخصی</Button>
        </div>

        <Card className="mt-6 bg-slate-900 text-white border-slate-900">
          <CardContent className="py-3 text-[11px] leading-6">
            <p className="font-bold">چطور کار می‌کند؟</p>
            <p className="text-slate-300 mt-1">هر ردیف در `business_members` + `user_roles` یک فضای کاری است. JWT شامل `globalRoles[]` و `memberships[]` است و با `token_version` بی‌صدا رفرش می‌شود. وقتی مالک شما را از تیم حذف کند، در ریکوئست بعدی دسترسی‌تان قطع می‌شود بدون نیاز به logout.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
