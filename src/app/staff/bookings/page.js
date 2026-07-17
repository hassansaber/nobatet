import { DashboardShell } from '@/components/layout/DashboardShell';
import { StaffBookings } from '@/components/staff/StaffBookings';

export const metadata = { title: 'نوبت‌های کارمند' };

export default function Page() {
  return (
    <DashboardShell title="نوبت‌ها" role="staff">
      <StaffBookings />
    </DashboardShell>
  );
}
