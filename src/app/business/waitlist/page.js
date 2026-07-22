import { DashboardShell } from '@/components/layout/DashboardShell';
import { WaitlistManager } from '@/components/business/WaitlistManager';

export const metadata = { title: 'لیست انتظار' };

export default function Page() {
  return (
    <DashboardShell title="لیست انتظار" role="business_owner">
      <WaitlistManager />
    </DashboardShell>
  );
}
