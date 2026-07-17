import { DashboardShell } from '@/components/layout/DashboardShell';
import { MyBookings } from '@/components/customer/MyBookings';

export const metadata = { title: 'نوبت‌های من' };

export default function Page() {
  return (
    <DashboardShell title="پنل مشتری" role="customer">
      <MyBookings mode="upcoming" />
    </DashboardShell>
  );
}
