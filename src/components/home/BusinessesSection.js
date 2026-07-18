'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, ArrowLeft } from 'lucide-react';
import { businessUrl } from '@/lib/tenant-url';

export function BusinessesSection() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/businesses');
        const data = await res.json();
        if (data.ok) setBusinesses(data.businesses || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse mx-auto" />
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-50 border animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-white border-y border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-bold text-primary flex items-center gap-2">کسب‌وکارهای فعال • {businesses.length}+</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">کسب‌وکارهایی که به نوبتت اعتماد کردن</h2>
            <p className="mt-2 text-sm text-muted-foreground">از سالن زیبایی تا کلینیک — همین الان رزرو کن</p>
          </div>
          <Link href="/pricing" className="hidden sm:inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-bold hover:bg-slate-50 cursor-pointer">
            دیدن همه
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map((biz) => (
            <a
              key={biz.id}
              href={businessUrl(biz.slug)}
              // same-tab برای حس یکپارچگی - قبلا _blank بود که حس نیو تب می‌داد
              rel="noopener noreferrer"
              className="group rounded-[1.5rem] border border-border bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className="relative h-32 bg-slate-100 overflow-hidden">
                <Image
                  src={biz.bannerUrl || biz.logoUrl || '/images/industry-salon.jpg'}
                  alt={biz.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-xl bg-white overflow-hidden border-2 border-white/80 shadow-md relative">
                      <Image src={biz.logoUrl || '/logo-icon.png'} alt={biz.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-black text-sm truncate drop-shadow">{biz.name}</p>
                      {biz.city && <p className="text-white/80 text-[11px] flex items-center gap-1"><MapPin className="size-3" />{biz.city}</p>}
                    </div>
                  </div>
                  <span className="size-6 rounded-full bg-white/90 flex items-center justify-center text-slate-900 group-hover:bg-primary group-hover:text-white transition-colors">
                    <ArrowLeft className="size-3.5" />
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground line-clamp-2 leading-6">{biz.description || 'رزرو آنلاین نوبت — سریع و بدون تماس'}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
                    <Star className="size-3 fill-amber-400 text-amber-400" /> ۴.۹
                  </span>
                  <span className="text-[11px] text-muted-foreground">رزرو آنلاین</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/pricing" className="inline-flex h-12 items-center rounded-xl bg-slate-900 text-white px-8 text-sm font-black hover:bg-slate-800 transition-colors cursor-pointer">
            شما هم کسب‌وکارتان را اضافه کنید →
          </Link>
        </div>
      </div>
    </section>
  );
}
