'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';

/**
 * شبیه‌ساز درگاه پرداخت — کاربر موفق/ناموفق را انتخاب می‌کند
 */
export function SandboxPayClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId') || '';
  const authority = searchParams.get('authority') || '';
  const amount = Number(searchParams.get('amount') || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function finish(success) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public/payments/sandbox/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, authority, success }),
      });
      const data = await res.json();
      if (success && data.ok) {
        router.push(
          `/pay/result?status=success&bookingId=${data.booking?.id || ''}`,
        );
      } else {
        router.push(
          `/pay/result?status=failed&message=${encodeURIComponent(data.error || 'پرداخت ناموفق')}`,
        );
      }
    } catch {
      setError('ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">
            SANDBOX
          </span>
          <span className="text-xs text-muted-foreground">درگاه آزمایشی نوبتت</span>
        </div>
        <CardTitle>پرداخت امن</CardTitle>
        <CardDescription>
          این صفحه جایگزین درگاه واقعی است. در پروداکشن با زرین‌پال/آیدی‌پی عوض می‌شود.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">مبلغ</span>
            <span className="font-bold">{formatRial(amount)} تومان</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">شناسه</span>
            <span dir="ltr" className="font-mono">
              {authority.slice(0, 24)}…
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-2">
          <Button
            className="w-full"
            loading={loading}
            onClick={() => finish(true)}
            disabled={!paymentId}
          >
            پرداخت موفق ✓
          </Button>
          <Button
            variant="danger"
            className="w-full"
            loading={loading}
            onClick={() => finish(false)}
            disabled={!paymentId}
          >
            پرداخت ناموفق
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
