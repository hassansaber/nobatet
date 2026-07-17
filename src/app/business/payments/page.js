import { DashboardShell } from '@/components/layout/DashboardShell';
import { PaymentsManager } from '@/components/business/PaymentsManager';

export const metadata = { title: 'تأیید پرداخت‌ها' };

export default function BusinessPaymentsPage() {
  return (
    <DashboardShell title="پرداخت‌ها" role="business_owner">
      <PaymentsManager />
    </DashboardShell>
  );
}
