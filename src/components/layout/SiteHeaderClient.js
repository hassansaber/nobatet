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

/**
 * هدر حرفه‌ای پلتفرم — sticky، blur، منوی موبایل، انیمیشن
 */
export function SiteHeaderClient({ isLoggedIn, dashboardHref, userLabel }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 12);
  });

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-border/80 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur-xl'
            : 'border-b border-transparent bg-white/70 backdrop-blur-md',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 min-w-0"
            onClick={() => setOpen(false)}
          >
            <span className="relative size-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-teal-900/10 shadow-md shadow-teal-900/10 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-3deg]">
              <Image
                src="/logo-icon.png"
                alt="لوگوی نوبتت"
                width={36}
                height={36}
                className="object-cover"
                priority
              />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tight text-foreground">
                نوبتت
              </span>
              <span className="hidden text-[10px] font-medium text-muted-foreground sm:block">
                نوبت‌دهی هوشمند
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-teal-50 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link
                href={dashboardHref}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-md shadow-teal-800/15 transition-all hover:bg-secondary hover:shadow-lg active:scale-[0.98]"
              >
                <span className="hidden sm:inline max-w-[8rem] truncate">
                  {userLabel || 'داشبورد'}
                </span>
                <span className="sm:hidden">داشبورد</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden h-10 items-center rounded-xl px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:inline-flex"
                >
                  ورود
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-md shadow-teal-800/15 transition-all hover:bg-secondary hover:shadow-lg active:scale-[0.98]"
                >
                  شروع رایگان
                </Link>
              </>
            )}

            <button
              type="button"
              aria-label={open ? 'بستن منو' : 'باز کردن منو'}
              aria-expanded={open}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-muted lg:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative block size-5">
                <span
                  className={cn(
                    'absolute inset-x-0 top-1 h-0.5 rounded bg-current transition-all',
                    open && 'top-2 rotate-45',
                  )}
                />
                <span
                  className={cn(
                    'absolute inset-x-0 top-2 h-0.5 rounded bg-current transition-all',
                    open && 'opacity-0',
                  )}
                />
                <span
                  className={cn(
                    'absolute inset-x-0 top-3 h-0.5 rounded bg-current transition-all',
                    open && 'top-2 -rotate-45',
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="بستن"
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 top-16 z-50 mx-3 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl shadow-slate-900/15 lg:hidden"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22 }}
            >
              <nav className="flex flex-col p-2">
                {NAV.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center rounded-xl px-4 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-teal-50 hover:text-primary active:bg-teal-100"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-border text-sm font-bold"
                  >
                    ورود
                  </Link>
                )}
                <Link
                  href={isLoggedIn ? dashboardHref : '/register'}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white',
                    isLoggedIn && 'col-span-2',
                  )}
                >
                  {isLoggedIn ? 'رفتن به داشبورد' : 'شروع رایگان'}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
