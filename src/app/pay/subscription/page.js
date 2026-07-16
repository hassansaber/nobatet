import { Suspense } from 'react';
import { SubscriptionPayClient } from '@/components/payment/SubscriptionPayClient';

export const metadata = { title: 'پرداخت اشتراک' };

export default function Page() {
  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        }
      >
        <SubscriptionPayClient />
      </Suspense>
    </div>
  );
}
