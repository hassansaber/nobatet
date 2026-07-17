import { DashboardShell } from '@/components/layout/DashboardShell';
import { LoyaltyManager } from '@/components/business/LoyaltyManager';

export const metadata = { title: 'باشگاه مشتریان' };

export default function Page() {
  return (
    <DashboardShell title="باشگاه" role="business_owner">
      <LoyaltyManager />
    </DashboardShell>
  );
}
