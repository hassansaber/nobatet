import { DashboardShell } from '@/components/layout/DashboardShell';
import { StaffBookings } from '@/components/staff/StaffBookings';

export const metadata = { title: 'تقویم کارمند' };

export default function Page() {
  return (
    <DashboardShell title="پنل کارمند" role="staff">
      <StaffBookings todayOnly />
    </DashboardShell>
  );
}
