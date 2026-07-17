import { Suspense } from 'react';
import { PayResultClient } from '@/components/payment/PayResultClient';

export const metadata = { title: 'نتیجه پرداخت' };

export default function PayResultPage() {
  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={<p className="text-sm text-muted-foreground">...</p>}>
        <PayResultClient />
      </Suspense>
    </div>
  );
}
