'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { cn } from '@/lib/utils';

const NAV = {
  business_owner: [
    { href: '/business', label: 'داشبورد' },
    { href: '/business/bookings', label: 'رزروها' },
    { href: '/business/payments', label: 'پرداخت‌ها' },
    { href: '/business/services', label: 'خدمات' },
    { href: '/business/staff', label: 'کارمندان' },
    { href: '/business/schedule', label: 'زمان‌بندی' },
    { href: '/business/customers', label: 'CRM' },
    { href: '/business/loyalty', label: 'باشگاه' },
    { href: '/business/reports', label: 'گزارش‌ها' },
    { href: '/business/settings', label: 'تنظیمات' },
  ],
  staff: [
    { href: '/staff', label: 'تقویم من' },
    { href: '/staff/bookings', label: 'نوبت‌ها' },
  ],
  customer: [
    { href: '/me', label: 'نوبت‌های من' },
    { href: '/me/history', label: 'تاریخچه' },
  ],
  visitor: [
    { href: '/visitor', label: 'داشبورد' },
    { href: '/visitor/businesses', label: 'بیزنس‌ها' },
    { href: '/visitor/commissions', label: 'کمیسیون' },
  ],
  super_admin: [
    { href: '/admin', label: 'نمای کلی' },
    { href: '/admin/businesses', label: 'بیزنس‌ها' },
    { href: '/admin/users', label: 'کاربران' },
    { href: '/admin/plans', label: 'پلن‌ها' },
  ],
};

function dashboardHome(role) {
  switch (role) {
    case 'super_admin':
      return '/admin';
    case 'visitor':
      return '/visitor';
    case 'business_owner':
      return '/business';
    case 'staff':
      return '/staff';
    default:
      return '/me';
  }
}

/**
 * @param {{ children: React.ReactNode, title?: string, role?: string }} props
 */
export function DashboardShell({ children, title, role: roleProp }) {
  const pathname = usePathname() || '';
  const [role, setRole] = useState(roleProp || 'customer');
  const [userName, setUserName] = useState('کاربر');

  useEffect(() => {
    if (roleProp) setRole(roleProp);
  }, [roleProp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.ok || !data.user) return;
        const name = [data.user.firstName, data.user.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
        setUserName(name || data.user.phone || 'کاربر');
        if (!roleProp && data.user.role) setRole(data.user.role);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roleProp]);

  const items = NAV[role] || NAV.customer;
  const home = dashboardHome(role);

  function isActive(href) {
    if (href === home) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-md shadow-sm shadow-slate-900/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={home}
              className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md shadow-teal-900/15"
            >
              <Image
                src="/logo-icon.png"
                alt="نوبتت"
                width={40}
                height={40}
                className="object-cover"
              />
            </Link>
            <div className="min-w-0">
              <p className="text-base font-black leading-none truncate">
                {title || 'داشبورد'}
              </p>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {userName}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm font-bold text-muted-foreground hover:text-danger px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              خروج
            </button>
          </form>
        </div>
        <nav className="mx-auto max-w-6xl px-2 overflow-x-auto">
          <ul className="flex gap-1.5 pb-2.5 min-w-max">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'inline-flex h-10 items-center rounded-xl px-3.5 text-sm font-bold transition-all',
                      active
                        ? 'bg-primary text-white shadow-md shadow-teal-800/20'
                        : 'text-muted-foreground hover:bg-teal-50 hover:text-primary',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
