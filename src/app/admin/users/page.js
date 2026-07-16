import { DashboardShell } from '@/components/layout/DashboardShell';
import { AdminUsers } from '@/components/admin/AdminUsers';

export const metadata = { title: 'کاربران · ادمین' };

export default function Page() {
  return (
    <DashboardShell title="کاربران" role="super_admin">
      <AdminUsers />
    </DashboardShell>
  );
}
