import { DashboardShell } from '@/components/layout/DashboardShell';
import { SubscriptionPanel } from '@/components/business/SubscriptionPanel';

export const metadata = { title: 'اشتراک' };

export default function Page() {
  return (
    <DashboardShell title="اشتراک" role="business_owner">
      <SubscriptionPanel />
    </DashboardShell>
  );
}
