import { DashboardShell } from '@/components/layout/DashboardShell';
import { ExpensesManager } from '@/components/business/ExpensesManager';

export const metadata = { title: 'حسابداری هزینه‌ها' };

export default function Page() {
  return (
    <DashboardShell title="حسابداری" role="business_owner">
      <ExpensesManager />
    </DashboardShell>
  );
}
