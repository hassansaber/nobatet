import { Suspense } from 'react';
import { UnifiedAuth } from '@/components/auth/UnifiedAuth';

export const metadata = { title: 'ورود یا ثبت‌نام | نوبتت' };

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-muted-foreground">در حال بارگذاری...</div>}>
      <UnifiedAuth />
    </Suspense>
  );
}
