import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = {
  title: 'ورود',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">در حال بارگذاری...</div>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
