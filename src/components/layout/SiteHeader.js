import Link from 'next/link';
import Image from 'next/image';
import { getSession, dashboardPathForRole } from '@/lib/auth';
import { SiteHeaderClient } from '@/components/layout/SiteHeaderClient';

export async function SiteHeader() {
  const session = await getSession();

  return (
    <SiteHeaderClient
      isLoggedIn={Boolean(session)}
      dashboardHref={session ? dashboardPathForRole(session.role) : '/login'}
      userLabel={
        session
          ? [session.firstName, session.lastName].filter(Boolean).join(' ') ||
            session.phone
          : null
      }
    />
  );
}

/** Server-safe logo used by client header via props path */
export function BrandMark({ className = 'size-9' }) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <Image
        src="/logo-icon.png"
        alt="نوبتت"
        width={36}
        height={36}
        className="rounded-xl object-cover shadow-sm shadow-teal-900/20"
        priority
      />
    </span>
  );
}
