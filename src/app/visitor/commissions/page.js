import { DashboardShell } from '@/components/layout/DashboardShell';
import { VisitorDashboard } from '@/components/visitor/VisitorDashboard';

export const metadata = { title: 'کمیسیون ویزیتور' };

export default function Page() {
  return (
    <DashboardShell title="کمیسیون" role="visitor">
      <VisitorDashboard tab="commissions" />
    </DashboardShell>
  );
}
