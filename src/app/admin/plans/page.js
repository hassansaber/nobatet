import { DashboardShell } from '@/components/layout/DashboardShell';
import { AdminPlans } from '@/components/admin/AdminPlans';

export const metadata = { title: 'پلن‌ها · ادمین' };

export default function Page() {
  return (
    <DashboardShell title="پلن‌ها" role="super_admin">
      <AdminPlans />
    </DashboardShell>
  );
}
