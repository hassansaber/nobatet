import { DashboardShell } from '@/components/layout/DashboardShell';
import { SettingsForm } from '@/components/business/SettingsForm';

export const metadata = { title: 'تنظیمات' };

export default function Page() {
  return (
    <DashboardShell title="تنظیمات" role="business_owner">
      <SettingsForm />
    </DashboardShell>
  );
}
