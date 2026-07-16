import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = {
  title: 'ثبت‌نام',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">در حال بارگذاری...</div>}>
      <AuthForm mode="register" defaultRole="business_owner" />
    </Suspense>
  );
}
