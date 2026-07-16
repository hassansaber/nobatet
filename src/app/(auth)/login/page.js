import { Suspense } from 'react';
import { UnifiedAuth } from '@/components/auth/UnifiedAuth';

export const metadata = { title: 'ورود یا ثبت‌نام' };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">در حال بارگذاری...</div>}>
      <UnifiedAuth defaultRole="customer" />
    </Suspense>
  );
}
