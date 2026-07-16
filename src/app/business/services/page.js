import { DashboardShell } from '@/components/layout/DashboardShell';
import { ServicesManager } from '@/components/business/ServicesManager';

export const metadata = { title: 'مدیریت خدمات' };

export default function BusinessServicesPage() {
  return (
    <DashboardShell title="خدمات" role="business_owner">
      <ServicesManager />
    </DashboardShell>
  );
}
