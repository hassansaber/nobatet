'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';

export function SubscriptionPayClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const invoiceId = sp.get('invoiceId') || '';
  const authority = sp.get('authority') || '';
  const amount = Number(sp.get('amount') || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function finish(success) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public/payments/subscription/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, authority, success }),
      });
      const data = await res.json();
      if (success && data.ok) {
        router.push('/business/subscription?paid=1');
      } else {
        router.push(
          `/pay/result?status=failed&message=${encodeURIComponent(data.error || 'ناموفق')}`,
        );
      }
    } catch {
      setError('ارتباط برقرار نشد');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <span className="rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 w-fit">
          SANDBOX · SUBSCRIPTION
        </span>
        <CardTitle className="mt-2">پرداخت اشتراک نوبتت</CardTitle>
        <CardDescription>
          شبیه‌ساز درگاه — در پروداکشن با درگاه واقعی عوض می‌شود
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted p-4 text-sm flex justify-between">
          <span className="text-muted-foreground">مبلغ</span>
          <span className="font-bold">{formatRial(amount)} تومان</span>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <Button
          className="w-full"
          loading={loading}
          disabled={!invoiceId}
          onClick={() => finish(true)}
        >
          پرداخت موفق ✓
        </Button>
        <Button
          variant="danger"
          className="w-full"
          loading={loading}
          onClick={() => finish(false)}
        >
          پرداخت ناموفق
        </Button>
      </CardContent>
    </Card>
  );
}
