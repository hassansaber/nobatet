import { getSession } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';

/**
 * Wrapper سرور برای پاس دادن نام کاربر به DashboardShell کلاینت
 */
export async function DashboardShellServer({ children, title, role }) {
  const session = await getSession();
  const userName =
    [session?.firstName, session?.lastName].filter(Boolean).join(' ') ||
    session?.phone ||
    'کاربر';

  return (
    <DashboardShell title={title} role={role || session?.role} userName={userName}>
      {children}
    </DashboardShell>
  );
}
