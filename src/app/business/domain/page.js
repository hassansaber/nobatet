import { DashboardShell } from '@/components/layout/DashboardShell';
import { DomainManager } from '@/components/business/DomainManager';

export const metadata = { title: 'دامنه اختصاصی' };

export default function Page() {
  return (
    <DashboardShell title="دامنه اختصاصی" role="business_owner">
      <DomainManager />
    </DashboardShell>
  );
}
