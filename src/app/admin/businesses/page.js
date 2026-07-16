import { DashboardShell } from '@/components/layout/DashboardShell';
import { AdminBusinesses } from '@/components/admin/AdminBusinesses';

export const metadata = { title: 'بیزنس‌ها · ادمین' };

export default function Page() {
  return (
    <DashboardShell title="بیزنس‌ها" role="super_admin">
      <AdminBusinesses />
    </DashboardShell>
  );
}
