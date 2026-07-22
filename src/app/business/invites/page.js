import { DashboardShell } from '@/components/layout/DashboardShell';
import { InvitesManager } from '@/components/business/InvitesManager';

export const metadata = { title: 'دعوت تیم' };

export default function Page() {
  return (
    <DashboardShell title="دعوت تیم" role="business_owner">
      <InvitesManager />
    </DashboardShell>
  );
}
