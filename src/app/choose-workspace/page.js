import { Suspense } from 'react';
import { ChooseWorkspaceClient } from '@/components/auth/ChooseWorkspaceClient';

export const metadata = { title: 'انتخاب فضای کاری | نوبتت' };

export default function ChooseWorkspacePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-muted-foreground">در حال بارگذاری فضاهای کاری...</div>}>
      <ChooseWorkspaceClient />
    </Suspense>
  );
}
