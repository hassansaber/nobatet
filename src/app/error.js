'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 px-4 py-12 text-center">
      <div className="size-20 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center text-3xl mx-auto">⚠️</div>
      <h1 className="mt-6 text-2xl font-black">مشکلی پیش آمد</h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-md leading-7">متأسفانه خطایی رخ داده. تیم فنی مطلع شده. لطفاً دوباره تلاش کنید یا به صفحه اصلی برگردید.</p>
      {error?.message && <p className="mt-3 text-xs font-mono bg-white border rounded-lg px-3 py-2 max-w-md truncate" dir="ltr">{error.message.slice(0, 120)}</p>}
      <div className="mt-6 flex gap-3 justify-center">
        <Button onClick={() => reset()}>تلاش مجدد</Button>
        <Link href="/" className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-5 text-sm font-bold">خانه</Link>
      </div>
    </div>
  );
}
