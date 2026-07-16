import { Suspense } from 'react';
import { UnifiedAuth } from '@/components/auth/UnifiedAuth';

export const metadata = { title: 'ثبت‌نام' };

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">در حال بارگذاری...</div>}>
      <UnifiedAuth defaultRole="business_owner" />
    </Suspense>
  );
}
