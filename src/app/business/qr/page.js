import { DashboardShell } from '@/components/layout/DashboardShell';
import { QrGenerator } from '@/components/business/QrGenerator';

export const metadata = { title: 'QR کد لندینگ' };

export default function Page() {
  return (
    <DashboardShell title="QR کد" role="business_owner">
      <QrGenerator />
    </DashboardShell>
  );
}
