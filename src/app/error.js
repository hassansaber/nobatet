'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 text-center relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#FEE2E2_0%,_transparent_50%),radial-gradient(ellipse_at_bottom,_#E0F2FE_0%,_transparent_50%)]" />
      <div className="relative w-full max-w-md">
        <div className="mx-auto size-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shadow-sm">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="mt-5 font-lalezar text-[20px] tracking-tight" style={{ fontFamily: 'var(--font-lalezar)' }}>مشکلی پیش آمد</h1>
        <p className="mt-2 text-[13px] text-muted-foreground leading-7 max-w-md mx-auto">
          متأسفانه خطایی رخ داده. تیم فنی مطلع شده. لطفا دوباره تلاش کنید یا به خانه برگردید.
        </p>
        {error?.message && (
          <div className="mt-4 text-[11px] font-mono glass p-3 rounded-xl text-left max-w-md mx-auto truncate" dir="ltr">
            {error.message.slice(0, 180)}
          </div>
        )}
        <div className="mt-6 flex gap-2 justify-center">
          <Button onClick={() => reset()} className="gap-1.5 h-10 text-[13px]">
            <RefreshCw className="size-4" />
            تلاش مجدد
          </Button>
          <Link href="/" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/40 glass px-5 text-[13px] font-medium hover:bg-white/60 cursor-pointer">
            <Home className="size-4" />
            خانه
          </Link>
        </div>
      </div>
    </div>
  );
}
