'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/#features', label: 'امکانات' },
  { href: '/#how', label: 'چطور کار می‌کند' },
  { href: '/#industries', label: 'کسب‌وکارها' },
  { href: '/#faq', label: 'سوالات' },
  { href: '/pricing', label: 'قیمت‌گذاری' },
  { href: '/demo', label: 'دمو' },
];

export function SiteHeaderClient({ isLoggedIn, dashboardHref, userLabel }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 10);
  });

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled ? 'glass-header-strong' : 'glass-header',
        )}
      >
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5 min-w-0" onClick={() => setOpen(false)}>
            <span className="relative size-9 shrink-0 overflow-hidden rounded-xl shadow-md shadow-primary/10 ring-1 ring-white/50 transition-transform duration-300 group-hover:scale-105">
              <Image src="/logo-icon.png" alt="لوگوی نوبتت" width={36} height={36} className="object-cover w-full h-full" priority />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-lalezar text-[17px] tracking-tight text-foreground leading-none" style={{ fontFamily: 'var(--font-lalezar)' }}>
                نوبتت
              </span>
              <span className="hidden text-[10px] font-medium text-muted-foreground sm:block tracking-wide mt-0.5">
                نوبت‌دهی هوشمند
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="relative rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-white/60 hover:text-primary">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link href={dashboardHref} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-[13px] font-medium text-white shadow-md shadow-teal-800/10 transition-all hover:bg-secondary hover:shadow-lg active:scale-[0.98] cursor-pointer">
                <span className="hidden sm:inline max-w-[7rem] truncate">{userLabel || 'داشبورد'}</span>
                <span className="sm:hidden">داشبورد</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden h-9 items-center rounded-xl px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-white/60 sm:inline-flex cursor-pointer">
                  ورود
                </Link>
                <Link href="/register" className="inline-flex h-9 items-center rounded-xl bg-primary px-3.5 text-[13px] font-medium text-white shadow-md shadow-teal-800/10 transition-all hover:bg-secondary hover:shadow-lg active:scale-[0.98] cursor-pointer">
                  شروع رایگان
                </Link>
              </>
            )}

            <button type="button" aria-label={open ? 'بستن منو' : 'باز کردن منو'} aria-expanded={open} className="inline-flex size-9 items-center justify-center rounded-xl border border-white/40 bg-white/50 text-foreground backdrop-blur transition-colors hover:bg-white/70 lg:hidden cursor-pointer" onClick={() => setOpen((v) => !v)}>
              <span className="relative block size-4">
                <span className={cn('absolute inset-x-0 top-0.5 h-0.5 rounded bg-current transition-all', open && 'top-1.5 rotate-45')} />
                <span className={cn('absolute inset-x-0 top-1.5 h-0.5 rounded bg-current transition-all', open && 'opacity-0')} />
                <span className={cn('absolute inset-x-0 top-2.5 h-0.5 rounded bg-current transition-all', open && 'top-1.5 -rotate-45')} />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <>
            <motion.button type="button" aria-label="بستن" className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[3px] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div className="fixed inset-x-0 top-[60px] z-50 mx-3 overflow-hidden rounded-2xl border border-white/40 bg-white/80 backdrop-blur-2xl shadow-2xl shadow-slate-900/15 lg:hidden" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.2 }}>
              <nav className="flex flex-col p-2">
                {NAV.map((item, i) => (
                  <motion.div key={item.href} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.02 * i }}>
                    <Link href={item.href} onClick={() => setOpen(false)} className="flex items-center rounded-xl px-4 py-3 text-[13px] font-medium text-foreground transition-colors hover:bg-white/70 hover:text-primary active:bg-teal-50">
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="grid grid-cols-2 gap-2 border-t border-white/40 p-3">
                {!isLoggedIn && (
                  <Link href="/login" onClick={() => setOpen(false)} className="inline-flex h-10 items-center justify-center rounded-xl border border-white/40 bg-white/60 text-[13px] font-medium backdrop-blur">ورود</Link>
                )}
                <Link href={isLoggedIn ? dashboardHref : '/register'} onClick={() => setOpen(false)} className={cn('inline-flex h-10 items-center justify-center rounded-xl bg-primary text-[13px] font-medium text-white', isLoggedIn && 'col-span-2')}>{isLoggedIn ? 'داشبورد' : 'شروع رایگان'}</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
