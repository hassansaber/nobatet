import { DashboardShell } from '@/components/layout/DashboardShell';
import { CrmManager } from '@/components/business/CrmManager';

export const metadata = { title: 'CRM مشتریان' };

export default function Page() {
  return (
    <DashboardShell title="CRM" role="business_owner">
      <CrmManager />
    </DashboardShell>
  );
}
