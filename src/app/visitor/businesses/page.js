import { DashboardShell } from '@/components/layout/DashboardShell';
import { VisitorDashboard } from '@/components/visitor/VisitorDashboard';

export const metadata = { title: 'بیزنس‌های ویزیتور' };

export default function Page() {
  return (
    <DashboardShell title="بیزنس‌ها" role="visitor">
      <VisitorDashboard tab="businesses" />
    </DashboardShell>
  );
}
