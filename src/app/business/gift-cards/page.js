import { DashboardShell } from '@/components/layout/DashboardShell';
import { GiftCardsManager } from '@/components/business/GiftCardsManager';

export const metadata = { title: 'کارت هدیه' };

export default function Page() {
  return (
    <DashboardShell title="کارت هدیه" role="business_owner">
      <GiftCardsManager />
    </DashboardShell>
  );
}
