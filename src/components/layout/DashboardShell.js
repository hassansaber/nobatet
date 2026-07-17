'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { cn } from '@/lib/utils';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

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
    { href: '/business/expenses', label: 'حسابداری' },
    { href: '/business/qr', label: 'QR' },
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

export function DashboardShell({ children, title, role: roleProp }) {
  const pathname = usePathname() || '';
  const [role, setRole] = useState(roleProp || 'customer');
  const [userName, setUserName] = useState('کاربر');
  const [businessSlug, setBusinessSlug] = useState(null);

  useEffect(() => {
    if (roleProp) setRole(roleProp);
  }, [roleProp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.ok || !data.user) return;
        const name = [data.user.firstName, data.user.lastName].filter(Boolean).join(' ').trim();
        setUserName(name || data.user.phone || 'کاربر');
        if (!roleProp && data.user.role) setRole(data.user.role);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [roleProp]);

  useEffect(() => {
    // تلاش برای گرفتن اسلاگ بیزنس برای دکمه لندینگ
    (async () => {
      try {
        const res = await fetch('/api/business/settings', { credentials: 'include' });
        const data = await res.json();
        if (data.ok && data.business?.slug) setBusinessSlug(data.business.slug);
      } catch {}
    })();
  }, []);

  const items = NAV[role] || NAV.customer;
  const home = dashboardHome(role);

  function isActive(href) {
    if (href === home) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // Breadcrumb generation from pathname
  const breadcrumbItems = (() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs = [];
    let path = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      path += `/${seg}`;
      // Skip numeric ids etc
      if (seg.length > 20 && /^[0-9a-f-]{20,}$/.test(seg)) continue;
      const labelMap = {
        business: 'کسب‌وکار',
        admin: 'ادمین',
        staff: 'کارمند',
        visitor: 'بازاریاب',
        me: 'من',
        bookings: 'رزروها',
        payments: 'پرداخت‌ها',
        services: 'خدمات',
        staff: 'کارمندان',
        schedule: 'زمان‌بندی',
        customers: 'مشتریان',
        loyalty: 'باشگاه',
        expenses: 'حسابداری',
        qr: 'QR',
        reports: 'گزارش‌ها',
        settings: 'تنظیمات',
        subscription: 'اشتراک',
        businesses: 'بیزنس‌ها',
        users: 'کاربران',
        plans: 'پلن‌ها',
        history: 'تاریخچه',
        commissions: 'کمیسیون',
      };
      const label = labelMap[seg] || seg;
      const isLast = i === segments.length - 1;
      crumbs.push({ label, href: isLast ? null : path });
    }
    return crumbs;
  })();

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';
  const isLocal = baseDomain.includes('localhost') || baseDomain.startsWith('127.');
  const protocol = isLocal ? 'http' : 'https';
  const businessLandingUrl = businessSlug ? `${protocol}://${businessSlug}.business.${baseDomain}` : null;

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-md shadow-sm shadow-slate-900/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              title="رفتن به صفحه اصلی سایت"
              className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md shadow-teal-900/15"
            >
              <Image src="/logo-icon.png" alt="نوبتت" width={40} height={40} className="object-cover" />
            </Link>
            <div className="min-w-0">
              <p className="text-base font-black leading-none truncate">{title || 'داشبورد'}</p>
              <p className="text-sm text-muted-foreground mt-1 truncate">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href="/" className="hidden sm:inline-flex h-8 items-center rounded-xl border border-border bg-white px-2.5 text-[11px] font-bold hover:bg-slate-50 cursor-pointer">
              خانه
            </Link>
            {businessLandingUrl && (
              <a href={businessLandingUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex h-8 items-center rounded-xl border border-blue-200 bg-blue-50 px-2.5 text-[11px] font-bold text-blue-800 hover:bg-blue-100 cursor-pointer">
                لندینگ
              </a>
            )}
            <Link href={home} className="hidden sm:inline-flex h-8 items-center rounded-xl border border-border bg-slate-900 text-white px-2.5 text-[11px] font-bold hover:bg-slate-800 cursor-pointer">
              داشبورد
            </Link>
            <WorkspaceSwitcher />
            <form action={logoutAction}>
              <button type="submit" className="text-xs font-bold text-muted-foreground hover:text-red-600 px-2.5 py-1.5 rounded-xl hover:bg-red-50 transition-colors">
                خروج
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-2 overflow-x-auto">
          <ul className="flex gap-1.5 pb-2.5 min-w-max">
            <li>
              <Link href="/" className="inline-flex h-9 items-center rounded-xl px-3 text-xs font-bold text-muted-foreground hover:bg-slate-100 cursor-pointer">
                سایت
              </Link>
            </li>
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'inline-flex h-9 items-center rounded-xl px-3 text-xs font-bold transition-all',
                      active ? 'bg-primary text-white shadow-md shadow-teal-800/20' : 'text-muted-foreground hover:bg-teal-50 hover:text-primary',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/choose-workspace" className="inline-flex h-9 items-center rounded-xl px-3 text-xs font-bold border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary">
                ⇄ انتخاب فضا
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        {breadcrumbItems.length > 1 && <Breadcrumb items={breadcrumbItems} />}
        {children}
      </main>
      <footer className="border-t border-border bg-white py-3 text-center text-[11px] text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-center gap-3">
          <span>نوبتت — نوبت‌دهی هوشمند</span>
          <Link href="/" className="font-bold text-primary hover:underline">صفحه اصلی</Link>
          <Link href="/pricing" className="hover:underline">قیمت‌ها</Link>
          <Link href="/choose-workspace" className="hover:underline">انتخاب فضای کاری</Link>
        </div>
      </footer>
    </div>
  );
}
