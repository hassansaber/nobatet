import { DashboardShell } from '@/components/layout/DashboardShell';
import { VisitorDashboard } from '@/components/visitor/VisitorDashboard';

export const metadata = { title: 'پنل ویزیتور' };

export default function Page() {
  return (
    <DashboardShell title="ویزیتور" role="visitor">
      <VisitorDashboard tab="home" />
    </DashboardShell>
  );
}
