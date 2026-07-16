import { Suspense } from 'react';
import { SandboxPayClient } from '@/components/payment/SandboxPayClient';

export const metadata = { title: 'پرداخت آزمایشی' };

export default function SandboxPayPage() {
  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">در حال بارگذاری درگاه...</p>
        }
      >
        <SandboxPayClient />
      </Suspense>
    </div>
  );
}
