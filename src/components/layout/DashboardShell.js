'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { LogOut, Home, LayoutDashboard, ExternalLink } from 'lucide-react';

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
  const router = useRouter();
  const [role, setRole] = useState(roleProp || 'customer');
  const [userName, setUserName] = useState('کاربر');
  const [businessSlug, setBusinessSlug] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (roleProp) setRole(roleProp);
  }, [roleProp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.ok || !data.user) return;
        const name = [data.user.firstName, data.user.lastName].filter(Boolean).join(' ').trim();
        setUserName(name || data.user.phone || 'کاربر');
        if (!roleProp && data.user.role) setRole(data.user.role);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [roleProp]);

  useEffect(() => {
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

  const breadcrumbItems = (() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs = [];
    let path = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      path += `/${seg}`;
      if (seg.length > 20 && /^[0-9a-f-]{20,}$/.test(seg)) continue;
      const labelMap = {
        business: 'کسب‌وکار',
        admin: 'ادمین',
        staff: 'کارمندان',
        visitor: 'بازاریاب',
        me: 'من',
        bookings: 'رزروها',
        payments: 'پرداخت‌ها',
        services: 'خدمات',
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
  const businessLandingUrl = businessSlug ? `${protocol}://${businessSlug}.${baseDomain}` : null;
  const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${baseDomain}`;

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      // 1) پاک کردن سشن روی host فعلی
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', cache: 'no-store' });
      } catch {}

      // 2) پاک کردن روی main domain (برای localhost و همچنین پروداکشن با domain مشترک)
      try {
        const mainOrigin = new URL(mainAppUrl).origin;
        if (window.location.origin !== mainOrigin) {
          await fetch(`${mainOrigin}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            cache: 'no-store',
          });
        }
      } catch {}

      // 3) در حالت localhost: تلاش برای logout روی تمام hostهایی که قبلا ویزیت کردیم
      try {
        const key = 'nobatet_visited_hosts';
        const visited = JSON.parse(localStorage.getItem(key) || '[]');
        for (const origin of visited) {
          if (origin === window.location.origin) continue;
          try {
            await fetch(`${origin}/api/auth/logout`, {
              method: 'POST',
              credentials: 'include',
              mode: 'cors',
              cache: 'no-store',
            });
          } catch {}
        }
        localStorage.removeItem(key);
      } catch {}

      // 4) پاکسازی storage های مرتبط با SSO
      try {
        sessionStorage.removeItem('nobatet_sso_pushed_to_main');
        localStorage.removeItem('nobatet_visited_hosts');
      } catch {}

      // 5) ریدایرکت نرم به login با full reload برای اطمینان از پاک شدن کش
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur-xl shadow-sm shadow-slate-900/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              title="رفتن به صفحه اصلی سایت"
              className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md shadow-teal-900/15 hover:shadow-lg transition-shadow"
            >
              <Image src="/logo-icon.png" alt="نوبتت" width={40} height={40} className="object-cover" />
            </Link>
            <div className="min-w-0">
              <p className="text-[15px] font-black leading-none truncate">{title || 'داشبورد'}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                {userName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href="/" className="hidden sm:inline-flex h-8 items-center gap-1 rounded-xl border border-border bg-white px-2.5 text-[11px] font-bold hover:bg-slate-50 transition-colors cursor-pointer">
              <Home className="size-3.5" />
              خانه
            </Link>
            {businessLandingUrl && (
              <a
                href={businessLandingUrl}
                // مهم: بدون target _blank تا سوییچ روان باشد (same-tab navigation)
                rel="noopener noreferrer"
                className="hidden sm:inline-flex h-8 items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 text-[11px] font-bold text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <ExternalLink className="size-3" />
                لندینگ
              </a>
            )}
            <Link href={home} className="hidden sm:inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-slate-900 text-white px-2.5 text-[11px] font-bold hover:bg-slate-800 transition-colors cursor-pointer">
              <LayoutDashboard className="size-3" />
              داشبورد
            </Link>
            <WorkspaceSwitcher />
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-red-50 px-3 text-[11px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" />
              {loggingOut ? '...' : 'خروج'}
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-2 overflow-x-auto scrollbar-none">
          <ul className="flex gap-1.5 pb-2.5 min-w-max">
            <li>
              <Link href="/" className="inline-flex h-9 items-center rounded-xl px-3 text-xs font-bold text-muted-foreground hover:bg-slate-100 cursor-pointer transition-colors">
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
              <Link href="/choose-workspace" className="inline-flex h-9 items-center rounded-xl px-3 text-xs font-bold border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                ⇄ انتخاب فضا
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-8 animate-[fadeIn_0.25s_ease]">
        {breadcrumbItems.length > 1 && <Breadcrumb items={breadcrumbItems} />}
        {children}
      </main>
      <footer className="border-t border-border bg-white/80 backdrop-blur py-3 text-center text-[11px] text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-center gap-3">
          <span>نوبتت — نوبت‌دهی هوشمند</span>
          <Link href="/" className="font-bold text-primary hover:underline">
            صفحه اصلی
          </Link>
          <Link href="/pricing" className="hover:underline">
            قیمت‌ها
          </Link>
          <Link href="/choose-workspace" className="hover:underline">
            انتخاب فضای کاری
          </Link>
        </div>
      </footer>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}} .scrollbar-none::-webkit-scrollbar{display:none} .scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
