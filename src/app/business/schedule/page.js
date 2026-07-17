import { DashboardShell } from '@/components/layout/DashboardShell';
import { ScheduleManager } from '@/components/business/ScheduleManager';

export const metadata = { title: 'زمان‌بندی' };

export default function Page() {
  return (
    <DashboardShell title="زمان‌بندی" role="business_owner">
      <ScheduleManager />
    </DashboardShell>
  );
}
