import { DashboardShell } from '@/components/layout/DashboardShell';
import { StaffManager } from '@/components/business/StaffManager';

export const metadata = { title: 'کارمندان' };

export default function Page() {
  return (
    <DashboardShell title="کارمندان" role="business_owner">
      <StaffManager />
    </DashboardShell>
  );
}
