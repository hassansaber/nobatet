import { DashboardShell } from '@/components/layout/DashboardShell';
import { BookingsManager } from '@/components/business/BookingsManager';

export const metadata = { title: 'مدیریت رزروها' };

export default function BusinessBookingsPage() {
  return (
    <DashboardShell title="رزروها" role="business_owner">
      <BookingsManager />
    </DashboardShell>
  );
}
