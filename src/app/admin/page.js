import { DashboardShell } from '@/components/layout/DashboardShell';
import { AdminOverview } from '@/components/admin/AdminOverview';

export const metadata = { title: 'سوپر ادمین' };

export default function Page() {
  return (
    <DashboardShell title="سوپر ادمین" role="super_admin">
      <AdminOverview />
    </DashboardShell>
  );
}
