import { DashboardShell } from '@/components/layout/DashboardShell';
import { MyBookings } from '@/components/customer/MyBookings';

export const metadata = { title: 'تاریخچه نوبت‌ها' };

export default function Page() {
  return (
    <DashboardShell title="تاریخچه" role="customer">
      <MyBookings mode="history" />
    </DashboardShell>
  );
}
