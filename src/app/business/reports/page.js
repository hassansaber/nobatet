import { DashboardShell } from '@/components/layout/DashboardShell';
import { ReportsDashboard } from '@/components/business/ReportsDashboard';

export const metadata = { title: 'گزارش‌ها' };

export default function Page() {
  return (
    <DashboardShell title="گزارش‌ها" role="business_owner">
      <ReportsDashboard />
    </DashboardShell>
  );
}
